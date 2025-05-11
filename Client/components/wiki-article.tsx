"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Edit, Check, CheckCircle, AlertCircle, HelpCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Define the reference data structure
type Reference = {
    title: string
    page: number
    description: string
    additionalReferences?: {
        title: string
        page: number
        description: string
    }[]
}

// Define the keyword data structure
type Keyword = {
    text: string
    color: "red" | "amber" | "green"
    reference: Reference
}

export default function WikiArticle() {
    const [activeReference, setActiveReference] = useState<Reference | null>(null)
    const [lenseMode, setLenseMode] = useState(false)
    const [editingDescription, setEditingDescription] = useState(false)
    const [tempDescription, setTempDescription] = useState("")
    const popupRef = useRef<HTMLDivElement>(null)

    // Add state to keep track of API-detected keywords
    const [apiKeywords, setApiKeywords] = useState<Array<any>>([])

    // State to track keywords and their current colors
    const [keywordsState, setKeywordsState] = useState<Record<string, Keyword>>({
        // LLM: {
        //     text: "LLM",
        //     color: "red",
        //     reference: {
        //         title: "Large Language Models: A Comprehensive Guide",
        //         page: 42,
        //         description:
        //             "Large Language Models (LLMs) are advanced AI systems trained on vast amounts of text data to understand and generate human-like language.",
        //         additionalReferences: [
        //             {
        //                 title: "Understanding Transformer Architecture in LLMs",
        //                 page: 87,
        //                 description:
        //                     "The transformer architecture that powers LLMs uses self-attention mechanisms to process text input in parallel rather than sequentially, enabling better capture of long-range dependencies in text."
        //             }
        //         ]
        //     },
        // },
    })

    // Track the currently active keyword
    const [activeKeyword, setActiveKeyword] = useState<string | null>(null)

    // Function to cycle through colors (red -> amber -> green -> red)
    const cycleColor = () => {
        if (!activeKeyword) return

        const keyword = keywordsState[activeKeyword]
        const nextColor = keyword.color === "red" ? "amber" : keyword.color === "amber" ? "green" : "red"

        setKeywordsState((prev) => ({
            ...prev,
            [activeKeyword]: {
                ...prev[activeKeyword],
                color: nextColor,
            },
        }))
    }

    // Function to save edited description
    const saveDescription = () => {
        if (!activeKeyword || !activeReference) return

        setKeywordsState((prev) => ({
            ...prev,
            [activeKeyword]: {
                ...prev[activeKeyword],
                reference: {
                    ...prev[activeKeyword].reference,
                    description: tempDescription,
                },
            },
        }))

        setEditingDescription(false)
    }

    // Function to process a new text through the keywords finder
    const processTextWithKeywordsFinder = async (text: string) => {
        if (!lenseMode) return;

        try {
            console.log("Text processing:", text);

            const response = await fetch("/api/keywords", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: text
                })
            }).catch(error => {
                console.error("Network error:", error);
                throw error; // Throw instead of returning custom object
            });

            if (!response.ok) {
                console.error("Failed to process text with keywords finder");
                return;
            }

            try {
                const result = await response.json();
                console.log("Keywords result:", result);
                return result;
                // The result is already formatted correctly
            } catch (error) {
                console.log("No keywords:", error);
                return [];
            }

        } catch (error) {
            console.error("Error processing text:", error);
            return [];
        }
    };

    // Function to merge API keywords with the existing keywords state
    const getMergedKeywords = () => {
        const mergedKeywords = { ...keywordsState };

        // Add API keywords to the merged set if they exist
        if (Array.isArray(apiKeywords) && apiKeywords.length > 0) {
            for (let i = 0; i < apiKeywords.length; i++) {
                const { keyword, knowledge_level, related_documents } = apiKeywords[i];
                let color: "red" | "amber" | "green" = "red";
                if (knowledge_level > 0.7) {
                    color = "green";
                } else if (knowledge_level > 0.3) {
                    color = "amber";
                }

                // Create reference from related documents if available
                let reference: Reference = {
                    title: "Auto-detected keyword",
                    page: 0,
                    description: "This keyword was automatically detected."
                };

                // If there are related docs, use the first one for reference info
                if (related_documents && related_documents.length > 0) {
                    reference = {
                        title: related_documents[0].file_name,
                        page: related_documents[0].page_number,
                        description: related_documents[0].text.slice(0, 300)
                    };
                }

                // Add or update the keyword in our merged set
                mergedKeywords[keyword] = {
                    text: keyword,
                    color,
                    reference
                };
            }
        }

        return mergedKeywords;
    }

    // Function to handle keyword click
    const handleKeywordClick = (keywordText: string, event: React.MouseEvent) => {
        // Get merged keywords using our utility function
        const mergedKeywords = getMergedKeywords();

        // Get the keyword from the merged set
        const keyword = mergedKeywords[keywordText];

        // Ensure the keyword exists before accessing its properties
        if (!keyword) {
            console.error(`Keyword "${keywordText}" not found in keywords state or API keywords`);
            return;
        }

        setActiveReference(keyword.reference)
        setActiveKeyword(keywordText)
        setTempDescription(keyword.reference.description)
        setEditingDescription(false)
    }

    // Function to close the reference popup
    const closeReference = () => {
        setActiveReference(null)
        setActiveKeyword(null)
        setEditingDescription(false)
    }

    // Effect to fetch keywords when text or lense mode changes
    useEffect(() => {
        const updateKeywordsFromAPI = async () => {
            if (!lenseMode) return;

            const articleText = document.querySelectorAll('.text-base.leading-relaxed');
            if (articleText.length > 0) {
                // Combine all text from the article
                var combinedText = Array.from(articleText)
                    .map(element => element.textContent || '')
                    .join(' ');
                // Process the combined text
                // combinedText = "n LLM agent is an autonomous or semi-autonomous system built on top of a Large Language Model (LLM) that can perform tasks, make decisions, and interact with its environment. These agents leverage the capabilities of LLMs while extending their functionality through additional components that enable goal-directed behavior. An LLM agent combines a large language model with additional components that allow it to act in pursuit of specified goals."
                console.log("Combined text:", combinedText);
                const keywords = await processTextWithKeywordsFinder(combinedText);
                // updateKeywordsFromAPI();
                setApiKeywords(keywords);
            }
        };
        updateKeywordsFromAPI();

    }, [lenseMode]);

    // Function to process text and highlight keywords
    const processText = (text: string) => {
        const result = []
        let currentIndex = 0

        // If lense mode is off, return the plain text
        if (!lenseMode) {
            return text
        }

        // Get merged keywords using our utility function
        const mergedKeywords = getMergedKeywords();

        // Sort keywords by length (descending) to match longer phrases first
        const sortedKeywordEntries = Object.entries(mergedKeywords).sort((a, b) => b[0].length - a[0].length)

        while (currentIndex < text.length) {
            let matched = false

            for (const [keywordText, keywordData] of sortedKeywordEntries) {
                if (text.substring(currentIndex).toLowerCase().startsWith(keywordText.toLowerCase())) {
                    // Get the actual case from the text
                    const actualText = text.substring(currentIndex, currentIndex + keywordText.length)

                    // Add the highlighted keyword
                    result.push(
                        <span
                            key={`${currentIndex}-${keywordText}`}
                            className={`cursor-pointer font-medium ${keywordData.color === "red"
                                ? "text-red-600"
                                : keywordData.color === "amber"
                                    ? "text-amber-500"
                                    : "text-green-500"
                                } hover:underline`}
                            onClick={(e) => handleKeywordClick(keywordText, e)}
                        >
                            {actualText}
                        </span>,
                    )

                    currentIndex += keywordText.length
                    matched = true
                    break
                }
            }

            if (!matched) {
                // If no keyword matches, add the current character to the result
                if (result.length > 0 && typeof result[result.length - 1] === "string") {
                    // Append to the previous string if it exists
                    result[result.length - 1] += text[currentIndex]
                } else {
                    // Otherwise create a new string
                    result.push(text[currentIndex])
                }
                currentIndex++
            }
        }

        return result
    }

    // Update the existing lenseMode toggle to use our function
    const toggleLenseMode = (enabled: boolean) => {
        setLenseMode(enabled);
        if (enabled) {
            // When lense mode is enabled, process the text from the webpage
            const articleText = document.querySelectorAll('.text-base.leading-relaxed');
            if (articleText.length > 0) {
                // Combine all text from the article
                const combinedText = Array.from(articleText)
                    .map(element => element.textContent || '')
                    .join(' ');
                console.log("Combined text:", combinedText);
                // Process the combined text
                processTextWithKeywordsFinder(combinedText);
            }
        }
    };

    // Function to redirect to community page
    const redirectToCommunity = () => {
        // Use the $BROWSER environment variable to open the page in the host's default browser
        const command = `"$BROWSER" http://localhost:3000`
        try {
            // Execute the command to open the browser
            window.open('', '_blank')?.close() // Workaround for popup blocker
            const execProcess = require('child_process').exec(command)
            console.log('Opening forum page in browser')
        } catch (error) {
            console.error('Failed to open browser:', error)
            // Fallback to the regular way if the command fails
            window.location.href = "/app/page"
        }
    }

    // Function to mark keyword as known (set to green)
    const markAsKnown = () => {
        if (!activeKeyword) return;

        setKeywordsState((prev) => ({
            ...prev,
            [activeKeyword]: {
                ...prev[activeKeyword],
                color: "green",
            },
        }));
    }

    // Function to simulate studying a keyword and update in backend
    const simulateStudy = async () => {
        if (!activeKeyword) return;

        try {
            console.log("Simulating study for:", activeKeyword);

            // Call the backend API to update knowledge level
            const response = await fetch("/api/simulate-study", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    keyword: activeKeyword
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Study simulation result:", result);

                // Get the new knowledge level from the response
                const newLevel = result.new_level || 0.25;

                // Determine color based on knowledge level
                let newColor: "red" | "amber" | "green" = "red";
                if (newLevel >= 0.75) {
                    newColor = "green";
                } else if (newLevel >= 0.5) {
                    newColor = "amber";
                }

                console.log(`Setting color to ${newColor} based on level ${newLevel}`);

                // 1. Update the keywordsState (for popup display)
                setKeywordsState((prev) => ({
                    ...prev,
                    [activeKeyword]: {
                        ...prev[activeKeyword],
                        color: newColor,
                    },
                }));

                // 2. Update the apiKeywords state (for text color in article)
                setApiKeywords((prev) => {
                    if (!Array.isArray(prev)) return prev;

                    // Create a new array with the updated knowledge level
                    return prev.map(item => {
                        if (item.keyword === activeKeyword) {
                            return {
                                ...item,
                                knowledge_level: newLevel
                            };
                        }
                        return item;
                    });
                });

                // 3. Force a re-render by toggling and restoring lense mode
                // if (lenseMode) {
                //     // Briefly toggle lense mode off and back on to refresh the view
                //     setLenseMode(false);
                //     setTimeout(() => setLenseMode(true), 50);
                // }

                // Show a success message
                // alert(`Successfully studied "${activeKeyword}" - Knowledge level: ${newLevel}`);
            } else {
                console.error("Failed to simulate study:", await response.text());
                alert("Failed to record your study progress. Please try again.");
            }
        } catch (error) {
            console.error("Error simulating study:", error);
            alert("An error occurred while recording your study progress.");
        }
    }

    // Function to create a flashcard (placeholder)
    const makeFlashcard = () => {
        if (!activeKeyword || !activeReference) return;
        console.log("Creating flashcard for:", activeKeyword);
        // This would integrate with a flashcard system
        alert(`Flashcard created for: ${activeKeyword}`);
    }

    // Function to create a concept map (placeholder)
    const makeMap = () => {
        if (!activeKeyword || !activeReference) return;
        console.log("Creating concept map for:", activeKeyword);
        // This would integrate with a mapping system
        alert(`Concept map started with: ${activeKeyword}`);
    }

    return (
        <div className="container mx-auto p-4">
            {/* Header with lense mode toggle */}
            <div className="border-b border-gray-300 pb-4 mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">LLM Agent</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Lens Mode</span>
                        <Switch checked={lenseMode} onCheckedChange={toggleLenseMode} aria-label="Toggle lense mode" />
                    </div>
                </div>
            </div>

            {/* Main content (full width) */}
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-sm">
                <section id="introduction" className="mb-6">
                    <p className="text-base leading-relaxed font-serif mb-4">
                        {processText(
                            "An LLM agent is an autonomous or semi-autonomous system built on top of a Large Language Model (LLM) that can perform tasks, make decisions, and interact with its environment. These agents leverage the capabilities of LLMs while extending their functionality through additional components that enable goal-directed behavior.",
                        )}
                    </p>
                </section>

                <section id="definition" className="mb-6">
                    <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-3">Definition</h2>
                    <p className="text-base leading-relaxed font-serif mb-4">
                        {processText(
                            "An LLM agent combines a large language model with additional components that allow it to act in pursuit of specified goals. Unlike basic LLMs that simply generate text in response to prompts, agents can plan, reason, use tools, and adapt their behavior based on feedback and context. The agent framework typically includes prompt engineering techniques to guide the LLM's behavior, mechanisms for tool use, and sometimes reinforcement learning to improve performance over time.",
                        )}
                    </p>
                </section>

                <section id="capabilities" className="mb-6">
                    <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-3">Capabilities</h2>
                    <p className="text-base leading-relaxed font-serif mb-4">
                        {processText(
                            "LLM agents exhibit several key capabilities that distinguish them from basic language models:",
                        )}
                    </p>
                    <ul className="list-disc list-inside text-base leading-relaxed font-serif mb-4 pl-4">
                        <li className="mb-2">
                            {processText(
                                "Reasoning: Agents can perform complex reasoning tasks, including chain-of-thought reasoning to break down problems into steps.",
                            )}
                        </li>
                        <li className="mb-2">
                            {processText(
                                "Tool use: They can interact with external tools and APIs to access information or perform actions beyond text generation.",
                            )}
                        </li>
                        <li className="mb-2">
                            {processText(
                                "Planning: Agents can formulate plans to achieve goals, adjusting these plans as circumstances change.",
                            )}
                        </li>
                        <li className="mb-2">
                            {processText(
                                "Memory: Advanced agents maintain context over extended interactions, effectively managing information within their context window.",
                            )}
                        </li>
                        <li className="mb-2">
                            {processText(
                                "Multimodal processing: Some agents can work with multiple types of data, including text, images, and potentially other modalities.",
                            )}
                        </li>
                    </ul>
                </section>

                <section id="architecture" className="mb-6">
                    <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-3">Architecture</h2>
                    <p className="text-base leading-relaxed font-serif mb-4">
                        {processText("The architecture of an LLM agent typically includes:")}
                    </p>
                    <ul className="list-disc list-inside text-base leading-relaxed font-serif mb-4 pl-4">
                        <li className="mb-2">
                            {processText(
                                "Core LLM: Usually based on transformer architecture, this provides the fundamental language understanding and generation capabilities.",
                            )}
                        </li>
                        <li className="mb-2">
                            {processText(
                                "Prompt framework: Specialized prompting techniques that structure the agent's thinking and behavior.",
                            )}
                        </li>
                        <li className="mb-2">
                            {processText("Tool integration: Mechanisms for the agent to call external tools, APIs, or services.")}
                        </li>
                        <li className="mb-2">
                            {processText("Memory system: Components that manage information retention across interactions.")}
                        </li>
                        <li className="mb-2">
                            {processText("Planning module: Systems that help the agent formulate and execute multi-step plans.")}
                        </li>
                    </ul>
                    <p className="text-base leading-relaxed font-serif mb-4">
                        {processText(
                            "Many agent architectures implement fine-tuning or other adaptation techniques to specialize the base LLM for agent-specific tasks.",
                        )}
                    </p>
                </section>

                <section id="applications" className="mb-6">
                    <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-3">Applications</h2>
                    <p className="text-base leading-relaxed font-serif mb-4">
                        {processText("LLM agents have numerous applications across various domains:")}
                    </p>
                    <ul className="list-disc list-inside text-base leading-relaxed font-serif mb-4 pl-4">
                        <li className="mb-2">
                            {processText(
                                "Personal assistants that can perform complex tasks like research, scheduling, and content creation",
                            )}
                        </li>
                        <li className="mb-2">{processText("Autonomous systems for data analysis and business intelligence")}</li>
                        <li className="mb-2">
                            {processText("Customer service agents capable of handling complex inquiries and taking actions")}
                        </li>
                        <li className="mb-2">
                            {processText("Research assistants that can search, synthesize, and analyze information")}
                        </li>
                        <li className="mb-2">
                            {processText("Creative partners for writing, design, and other creative endeavors")}
                        </li>
                    </ul>
                </section>

                <section id="limitations" className="mb-6">
                    <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-3">Limitations</h2>
                    <p className="text-base leading-relaxed font-serif mb-4">
                        {processText("Despite their capabilities, LLM agents face several limitations:")}
                    </p>
                    <ul className="list-disc list-inside text-base leading-relaxed font-serif mb-4 pl-4">
                        <li className="mb-2">
                            {processText("Hallucination: Agents may generate incorrect information or make false claims.")}
                        </li>
                        <li className="mb-2">
                            {processText(
                                "Context limitations: Even with memory systems, agents are constrained by the context window of their underlying LLM.",
                            )}
                        </li>
                        <li className="mb-2">
                            {processText(
                                "Tool use challenges: Agents may struggle to use tools correctly or choose appropriate tools for tasks.",
                            )}
                        </li>
                        <li className="mb-2">
                            {processText(
                                "Planning limitations: Complex, long-term planning remains challenging for current agent architectures.",
                            )}
                        </li>
                        <li className="mb-2">
                            {processText(
                                "Safety and alignment: Ensuring agents act according to human values and safety constraints is an ongoing challenge.",
                            )}
                        </li>
                    </ul>
                </section>
            </div>

            {/* Reference popup with description */}
            {activeReference && (
                <div
                    ref={popupRef}
                    className="fixed bg-blue-50 border border-blue-200 shadow-lg p-4 rounded-lg z-50 max-w-md"
                    style={{
                        top: '80px',  // Fixed distance from top
                        right: '30px', // Fixed position on right side
                        bottom: 'auto',
                        left: 'auto',
                        maxHeight: 'calc(100vh - 120px)',
                        overflowY: 'auto'
                    }}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-blue-600">References</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={cycleColor}
                                className="rounded-full h-8 w-8 bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all"
                                title="Mark as understood (red → amber → green)"
                            >
                                {activeKeyword && keywordsState[activeKeyword]?.color === "red" && (
                                    <HelpCircle size={16} className="text-red-600" />
                                )}
                                {activeKeyword && keywordsState[activeKeyword]?.color === "amber" && (
                                    <AlertCircle size={16} className="text-amber-500" />
                                )}
                                {activeKeyword && keywordsState[activeKeyword]?.color === "green" && (
                                    <CheckCircle size={16} className="text-green-500" />
                                )}
                            </button>
                            <button
                                onClick={closeReference}
                                className="rounded-full h-8 w-8 bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all"
                            >
                                <X size={16} className="text-blue-600" />
                            </button>
                        </div>
                    </div>

                    {/* Primary reference */}
                    <div className="border-t border-blue-200 pt-2 mt-2 mb-4">
                        <p className="text-sm font-medium mb-2 text-blue-600">
                            {activeReference.title} (p. {activeReference.page})
                        </p>
                        {editingDescription ? (
                            <div className="space-y-2">
                                <Textarea
                                    value={tempDescription}
                                    onChange={(e) => setTempDescription(e.target.value)}
                                    className="w-full min-h-[100px] text-sm"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingDescription(false)}
                                        className="bg-white hover:bg-gray-100 text-gray-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={saveDescription}
                                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Check size={14} /> Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start">
                                <p className="text-sm text-gray-700">{activeReference.description}</p>
                                <button
                                    onClick={() => setEditingDescription(true)}
                                    className="rounded-full h-6 w-6 bg-blue-100 hover:bg-blue-200 flex items-center justify-center ml-2 flex-shrink-0 transition-all"
                                    title="Edit description"
                                >
                                    <Edit size={14} className="text-blue-600" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Secondary reference */}
                    {activeReference.additionalReferences && activeReference.additionalReferences.length > 0 && (
                        <div className="border-t border-blue-200 pt-2 mt-2 mb-4">
                            <p className="text-sm font-medium mb-2 text-blue-600">
                                {activeReference.additionalReferences[0].title} (p. {activeReference.additionalReferences[0].page})
                            </p>
                            <p className="text-sm text-gray-700">
                                {activeReference.additionalReferences[0].description}
                            </p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="border-t border-blue-200 pt-4 mt-2 grid grid-cols-2 gap-2">
                        <Button
                            onClick={makeFlashcard}
                            variant="outline"
                            className="bg-white hover:bg-gray-50 border-blue-200 text-blue-700"
                        >
                            Make Flashcard
                        </Button>
                        <Button
                            onClick={makeMap}
                            variant="outline"
                            className="bg-white hover:bg-gray-50 border-blue-200 text-blue-700"
                        >
                            Make Map
                        </Button>
                        <Button
                            onClick={redirectToCommunity}
                            variant="outline"
                            className="bg-white hover:bg-gray-50 border-blue-200 text-blue-700"
                        >
                            Ask a Question
                        </Button>
                        <Button
                            onClick={simulateStudy}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Simulate Study
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
