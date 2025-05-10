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
}

// Define the keyword data structure
type Keyword = {
    text: string
    color: "red" | "amber" | "green"
    reference: Reference
}

export default function WikiArticle() {
    const [activeReference, setActiveReference] = useState<Reference | null>(null)
    const [referencePosition, setReferencePosition] = useState({
        top: 0,
        left: 0,
        placement: "below" as "below" | "above",
    })
    const [lenseMode, setLenseMode] = useState(false)
    const [editingDescription, setEditingDescription] = useState(false)
    const [tempDescription, setTempDescription] = useState("")
    const popupRef = useRef<HTMLDivElement>(null)

    // State to track keywords and their current colors
    const [keywordsState, setKeywordsState] = useState<Record<string, Keyword>>({
        LLM: {
            text: "LLM",
            color: "red",
            reference: {
                title: "Large Language Models: A Comprehensive Guide",
                page: 42,
                description:
                    "Large Language Models (LLMs) are advanced AI systems trained on vast amounts of text data to understand and generate human-like language.",
            },
        },
        agent: {
            text: "agent",
            color: "amber",
            reference: {
                title: "Autonomous AI Systems",
                page: 78,
                description:
                    "In AI, an agent is a system that can perceive its environment, make decisions, and take actions to achieve specific goals.",
            },
        },
        "prompt engineering": {
            text: "prompt engineering",
            color: "green",
            reference: {
                title: "The Art of Prompting",
                page: 103,
                description:
                    "The practice of designing and refining inputs to AI systems to elicit desired outputs, often involving specific techniques and strategies.",
            },
        },
        "fine-tuning": {
            text: "fine-tuning",
            color: "red",
            reference: {
                title: "Advanced Model Training Techniques",
                page: 215,
                description:
                    "The process of further training a pre-trained model on a specific dataset to adapt it for particular tasks or domains.",
            },
        },
        "reinforcement learning": {
            text: "reinforcement learning",
            color: "amber",
            reference: {
                title: "Machine Learning Fundamentals",
                page: 167,
                description:
                    "A machine learning approach where an agent learns to make decisions by taking actions in an environment to maximize cumulative rewards.",
            },
        },
        "natural language processing": {
            text: "natural language processing",
            color: "green",
            reference: {
                title: "Computational Linguistics",
                page: 89,
                description:
                    "The field of AI focused on enabling computers to understand, interpret, and generate human language in useful ways.",
            },
        },
        "transformer architecture": {
            text: "transformer architecture",
            color: "red",
            reference: {
                title: "Neural Network Architectures",
                page: 132,
                description:
                    "A neural network architecture that uses self-attention mechanisms to process sequential data, forming the foundation of modern LLMs.",
            },
        },
        "chain-of-thought": {
            text: "chain-of-thought",
            color: "amber",
            reference: {
                title: "Cognitive AI Systems",
                page: 201,
                description:
                    "A prompting technique that encourages LLMs to break down complex reasoning tasks into a series of intermediate steps.",
            },
        },
        multimodal: {
            text: "multimodal",
            color: "green",
            reference: {
                title: "Beyond Text: Multimodal AI",
                page: 175,
                description:
                    "AI systems capable of processing and generating multiple types of data, such as text, images, audio, and video.",
            },
        },
        reasoning: {
            text: "reasoning",
            color: "red",
            reference: {
                title: "AI Reasoning Capabilities",
                page: 94,
                description:
                    "The ability of AI systems to form logical conclusions, make inferences, and solve problems through structured thinking.",
            },
        },
        "tool use": {
            text: "tool use",
            color: "amber",
            reference: {
                title: "AI Systems Integration",
                page: 156,
                description:
                    "The capability of AI agents to utilize external software, APIs, or services to extend their functionality beyond their core capabilities.",
            },
        },
        API: {
            text: "API",
            color: "green",
            reference: {
                title: "Application Programming Interfaces",
                page: 63,
                description:
                    "A set of rules and protocols that allows different software applications to communicate with each other.",
            },
        },
        "context window": {
            text: "context window",
            color: "red",
            reference: {
                title: "LLM Technical Specifications",
                page: 118,
                description:
                    "The maximum amount of text an LLM can process at once, limiting how much information it can consider when generating responses.",
            },
        },
        autonomous: {
            text: "autonomous",
            color: "amber",
            reference: {
                title: "Self-Directed AI Systems",
                page: 227,
                description:
                    "The ability of an AI system to operate independently, making decisions and taking actions without direct human intervention.",
            },
        },
        hallucination: {
            text: "hallucination",
            color: "green",
            reference: {
                title: "LLM Limitations and Challenges",
                page: 143,
                description:
                    "When an AI generates information that is factually incorrect or has no basis in its training data, essentially 'making things up'.",
            },
        },
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

    // Effect to check popup position and adjust if needed
    useEffect(() => {
        if (popupRef.current && activeReference) {
            const popup = popupRef.current
            const rect = popup.getBoundingClientRect()

            // Check if popup goes below viewport
            if (rect.bottom > window.innerHeight) {
                setReferencePosition((prev) => ({
                    ...prev,
                    placement: "above",
                    top: prev.top - rect.height - 40, // Position above with some offset
                }))
            }

            // Check if popup goes beyond right edge
            if (rect.right > window.innerWidth) {
                setReferencePosition((prev) => ({
                    ...prev,
                    left: window.innerWidth - rect.width - 20, // 20px margin from right edge
                }))
            }
        }
    }, [activeReference, popupRef.current])

    // Function to handle keyword click
    const handleKeywordClick = (keywordText: string, event: React.MouseEvent) => {
        const keyword = keywordsState[keywordText]
        setActiveReference(keyword.reference)
        setActiveKeyword(keywordText)
        setTempDescription(keyword.reference.description)
        setEditingDescription(false)

        // Calculate position for the reference popup
        const rect = (event.target as HTMLElement).getBoundingClientRect()
        setReferencePosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            placement: "below",
        })
    }

    // Function to close the reference popup
    const closeReference = () => {
        setActiveReference(null)
        setActiveKeyword(null)
        setEditingDescription(false)
    }

    // Function to process text and highlight keywords
    const processText = (text: string) => {
        const result = []
        let currentIndex = 0

        // If lense mode is off, return the plain text
        if (!lenseMode) {
            return text
        }

        // Sort keywords by length (descending) to match longer phrases first
        const sortedKeywordEntries = Object.entries(keywordsState).sort((a, b) => b[0].length - a[0].length)

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

    return (
        <div className="container mx-auto p-4">
            {/* Header with lense mode toggle */}
            <div className="border-b border-gray-300 pb-4 mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">LLM Agent</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Lense Mode</span>
                        <Switch checked={lenseMode} onCheckedChange={setLenseMode} aria-label="Toggle lense mode" />
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
                        top: referencePosition.placement === "below" ? `${referencePosition.top}px` : "auto",
                        bottom:
                            referencePosition.placement === "above" ? `${window.innerHeight - referencePosition.top + 40}px` : "auto",
                        left: `${referencePosition.left}px`,
                    }}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-blue-600">Reference</h3>
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
                    <p className="text-sm font-medium mb-2 text-blue-600">
                        {activeReference.title} (p. {activeReference.page})
                    </p>
                    <div className="border-t border-blue-200 pt-2 mt-2">
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
                </div>
            )}
        </div>
    )
}
