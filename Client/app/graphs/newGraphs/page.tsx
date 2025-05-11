"use client"

import type React from "react"

import { useMemo } from "react"

import { useState, useRef, useEffect } from "react"
import * as d3 from "d3"
import BraynrHeader from "@/components/braynr-header" // Import BraynrHeader
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertCircle, HelpCircle, Send, X, Upload, FileText } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ProjectData, GraphNode, GraphLink } from "@/types/project-data"
import { toast } from "@/components/ui/use-toast"

export default function SubjectProgressGraph() {
    const svgRef = useRef(null)
    const containerRef = useRef(null)
    const [chatOpen, setChatOpen] = useState(false)
    const [chatInput, setChatInput] = useState("")
    const [chatMessages, setChatMessages] = useState([
        { role: "bot", content: "Hi there! I'm your study buddy. How can I help you with your studies today?" },
    ])
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [currentPage, setCurrentPage] = useState(1)
    const topicsPerPage = 3
    const [progressFilter, setProgressFilter] = useState("all")
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [projectName, setProjectName] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [jsonData, setJsonData] = useState<ProjectData | null>(null)
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pdfUploaded, setPdfUploaded] = useState(false) // Track if PDF has been uploaded

    // Fetch data from the API endpoint
    const fetchGraphData = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch('http://localhost:8000/testdb/specific-graph')
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`)
            }
            const data = await response.json()
            setJsonData(data)
            setPdfUploaded(true) // Set PDF as uploaded when data is successfully fetched
        } catch (err) {
            console.error('Error fetching graph data:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch graph data')
            toast({
                title: "Error",
                description: `Failed to load graph data: ${err instanceof Error ? err.message : 'Unknown error'}`,
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    // Convert the JSON data to our graph format
    const graphData = useMemo(() => {
        if (!jsonData) return { nodes: [], links: [] }

        // Create nodes from the planning_graph
        const nodes: GraphNode[] = jsonData.planning_graph.nodes_id.map((id, index) => {
            const isKnown = jsonData.known_topics.includes(jsonData.planning_graph.nodes[index])
            return {
                id,
                name: jsonData.planning_graph.nodes[index],
                status: isKnown ? "completed" : "not_studied",
                progress: isKnown ? 100 : 0,
            }
        })

        // Create links from the edges
        const links: GraphLink[] = jsonData.planning_graph.edges.map((edge) => ({
            source: edge[0],
            target: edge[1],
            value: 1, // All edges are prerequisites in this case
        }))

        return { nodes, links }
    }, [jsonData])

    // Filter topics based on progressFilter
    const filteredTopics = useMemo(() => {
        if (progressFilter === "all") {
            return [...graphData.nodes]
        }
        return graphData.nodes.filter((node) => node.status === progressFilter)
    }, [graphData.nodes, progressFilter])

    // Get current page topics
    const indexOfLastTopic = currentPage * topicsPerPage
    const indexOfFirstTopic = indexOfLastTopic - topicsPerPage
    const currentTopics = filteredTopics.slice(indexOfFirstTopic, indexOfLastTopic)
    const totalPages = Math.ceil(filteredTopics.length / topicsPerPage)

    // Count topics by status
    const counts = {
        completed: graphData.nodes.filter((node) => node.status === "completed").length,
        needs_improvement: graphData.nodes.filter((node) => node.status === "needs_improvement").length,
        not_studied: graphData.nodes.filter((node) => node.status === "not_studied").length,
        total: graphData.nodes.length,
    }

    // Node color based on status
    const getNodeColor = (node: GraphNode) => {
        switch (node.status) {
            case "completed":
                return "#10b981" // green
            case "needs_improvement":
                return "#f59e0b" // amber
            case "not_studied":
                return "#6b7280" // gray
            default:
                return "#6b7280"
        }
    }

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case "needs_improvement":
                return <AlertCircle className="h-5 w-5 text-amber-500" />
            case "not_studied":
                return <HelpCircle className="h-5 w-5 text-gray-500" />
            default:
                return null
        }
    }

    // Get progress color
    const getProgressColor = (progress: number) => {
        if (progress === 100) return "bg-green-500"
        if (progress >= 60) return "bg-amber-500"
        return "bg-gray-500"
    }

    // Handle file upload
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
        }
    }

    // Handle form submission
    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedFile || !projectName) return

        // Instead of using hardcoded sample data, fetch from the API
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('http://localhost:8000/testdb/specific-graph')
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`)
            }

            let data = await response.json()

            // Optionally, we can update some fields based on the uploaded file
            data.project_name = projectName
            data.current_active_file = selectedFile.name
            if (!data.files) {
                data.files = { pdf: [selectedFile.name] }
            } else if (data.files.pdf) {
                if (!data.files.pdf.includes(selectedFile.name)) {
                    data.files.pdf.push(selectedFile.name)
                }
            }

            setJsonData(data)
            setPdfUploaded(true) // Set PDF as uploaded
            toast({
                title: "Success",
                description: "Graph data loaded successfully!",
            })
        } catch (err) {
            console.error('Error fetching graph data:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch graph data')
            toast({
                title: "Error",
                description: `Failed to load graph data: ${err instanceof Error ? err.message : 'Unknown error'}`,
                variant: "destructive"
            })
        } finally {
            setLoading(false)
            setUploadDialogOpen(false)
        }
    }

    // Handle chat input submission
    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!chatInput.trim()) return

        // Add user message
        setChatMessages((prev) => [...prev, { role: "user", content: chatInput }])

        // Simulate bot response
        setTimeout(() => {
            let response =
                "I'll help you with your machine learning studies! What specific topic would you like to learn more about?"

            // Simple keyword matching for demo purposes
            if (chatInput.toLowerCase().includes("pca") || chatInput.toLowerCase().includes("principal component")) {
                response =
                    "Principal Component Analysis (PCA) is a dimensionality reduction technique that transforms data into a new coordinate system where the greatest variance lies on the first coordinate (first principal component)."
            } else if (chatInput.toLowerCase().includes("bayes") || chatInput.toLowerCase().includes("bayesian")) {
                response =
                    "Bayesian Classification is based on Bayes' Theorem, which describes the probability of an event based on prior knowledge of conditions related to the event."
            } else if (chatInput.toLowerCase().includes("decision tree")) {
                response =
                    "Decision Trees are a non-parametric supervised learning method used for classification and regression. The goal is to create a model that predicts the value of a target variable by learning simple decision rules inferred from the data features."
            }

            setChatMessages((prev) => [...prev, { role: "bot", content: response }])
        }, 1000)

        setChatInput("")
    }

    // Update dimensions on resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect()
                setDimensions({ width, height })
            }
        }

        updateDimensions()
        window.addEventListener("resize", updateDimensions)
        return () => window.removeEventListener("resize", updateDimensions)
    }, [])

    // Render graph using D3
    useEffect(() => {
        if (!svgRef.current || dimensions.width === 0 || graphData.nodes.length === 0) return

        const svg = d3.select(svgRef.current)
        svg.selectAll("*").remove()

        const width = dimensions.width
        const height = dimensions.height || 480

        // Create a force simulation
        const simulation = d3
            .forceSimulation(graphData.nodes)
            .force(
                "link",
                d3
                    .forceLink(graphData.links)
                    .id((d: any) => d.id)
                    .distance(100),
            )
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(50))

        // Create a container for the graph
        const g = svg.append("g")

        // Add zoom functionality
        const zoom = d3
            .zoom()
            .scaleExtent([0.5, 3])
            .on("zoom", (event) => {
                g.attr("transform", event.transform)
            })

        svg.call(zoom as any)

        // Create links
        const link = g
            .append("g")
            .selectAll("line")
            .data(graphData.links)
            .enter()
            .append("line")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", (d) => (d.value === 1 ? 2 : 1))
            .attr("stroke-dasharray", (d) => (d.value === 0.5 ? "3,3" : "none"))

        // Add arrowheads for prerequisite links
        svg
            .append("defs")
            .selectAll("marker")
            .data(["prerequisite"])
            .enter()
            .append("marker")
            .attr("id", (d) => d)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("fill", "#999")
            .attr("d", "M0,-5L10,0L0,5")

        // Apply arrowheads to prerequisite links
        link.filter((d) => d.value === 1).attr("marker-end", "url(#prerequisite)")

        // Create node groups
        const node = g
            .append("g")
            .selectAll(".node")
            .data(graphData.nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .on("click", (event, d) => {
                setSelectedNode(d)
                event.stopPropagation()
            })
            .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended) as any)

        // Add circles to nodes
        node
            .append("circle")
            .attr("r", 10)
            .attr("fill", (d) => getNodeColor(d))

        // Add text labels to nodes
        node
            .append("text")
            .attr("dy", 25)
            .attr("text-anchor", "middle")
            .text((d) => d.name)
            .attr("font-size", "12px")
            .attr("pointer-events", "none")

        // Clear selection when clicking on the background
        svg.on("click", () => setSelectedNode(null))

        // Update positions on each tick of the simulation
        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y)

            node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)
        })

        // Drag functions
        function dragstarted(event: any, d: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
        }

        function dragged(event: any, d: any) {
            d.fx = event.x
            d.fy = event.y
        }

        function dragended(event: any, d: any) {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
        }

        // Cleanup
        return () => {
            simulation.stop()
        }
    }, [dimensions, graphData])

    // Pagination controls
    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [progressFilter])

    return (
        <>
            <BraynrHeader />
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-center">Subject Progress Tracker</h1>

                {/* Progress Bars Section */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Topic Progress & Learning Path</CardTitle>
                        <CardDescription>
                            {loading ? "Loading graph data..." :
                                error ? `Error: ${error}` :
                                    jsonData ? `Project: ${jsonData.project_name} | Current PDF: ${jsonData.current_active_file}` :
                                        "Upload a PDF to start tracking your learning progress"}
                        </CardDescription>
                        <Tabs defaultValue="all" className="w-full mt-2" onValueChange={setProgressFilter}>
                            <TabsList className="grid grid-cols-4 w-full">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="completed">Completed</TabsTrigger>
                                <TabsTrigger value="needs_improvement">Needs Improvement</TabsTrigger>
                                <TabsTrigger value="not_studied">Not Studied</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : graphData.nodes.length > 0 ? (
                            <>
                                <div className="space-y-4">
                                    {currentTopics.map((topic) => (
                                        <div key={topic.id} className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(topic.status)}
                                                    <span className="font-medium">{topic.name}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Progress value={topic.progress} className={`h-2 ${getProgressColor(topic.progress)}`} />
                                                <span className="text-sm font-medium">{topic.progress}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex justify-between items-center mt-6">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {indexOfFirstTopic + 1}-{Math.min(indexOfLastTopic, filteredTopics.length)} of{" "}
                                        {filteredTopics.length} topics
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 1}>
                                            Previous
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages}>
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="rounded-full bg-blue-50 p-3 mb-4">
                                    <Upload className="h-6 w-6 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">No PDF uploaded yet</h3>
                                <p className="text-muted-foreground max-w-md mb-6">
                                    Upload a PDF file to start tracking your learning progress and visualize your knowledge graph.
                                </p>
                                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>Upload PDF</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Upload PDF</DialogTitle>
                                            <DialogDescription>
                                                Upload a PDF file and enter your project name to start tracking your progress.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleUploadSubmit}>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="project-name" className="text-right">
                                                        Project Name
                                                    </Label>
                                                    <Input
                                                        id="project-name"
                                                        value={projectName}
                                                        onChange={(e) => setProjectName(e.target.value)}
                                                        className="col-span-3"
                                                        required
                                                    />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="pdf-file" className="text-right">
                                                        PDF File
                                                    </Label>
                                                    <div className="col-span-3">
                                                        <Input id="pdf-file" type="file" accept=".pdf" onChange={handleFileChange} required />
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" disabled={loading}>
                                                    {loading ? "Loading..." : "Upload"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-4">
                        <Card className="h-[600px] relative">
                            <CardHeader>
                                <CardTitle>Knowledge Graph</CardTitle>
                                <CardDescription>Visualize your learning path and topic relationships</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 h-[480px]" ref={containerRef}>
                                {loading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : pdfUploaded && graphData.nodes.length > 0 ? (
                                    <svg ref={svgRef} width="100%" height="100%" className="overflow-hidden" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="rounded-full bg-blue-50 p-3 mb-4">
                                            <FileText className="h-6 w-6 text-blue-500" />
                                        </div>
                                        <h3 className="text-lg font-medium mb-2">Your knowledge graph will appear here</h3>
                                        <p className="text-muted-foreground max-w-md">
                                            Upload a PDF to visualize your learning path and topic relationships.
                                        </p>
                                    </div>
                                )}
                            </CardContent>

                            {/* PDF Viewer Button (if PDF is uploaded) */}
                            {jsonData && (
                                <div className="absolute bottom-4 left-4 z-10">
                                    <Button variant="outline" className="bg-blue-50 hover:bg-blue-100">
                                        <FileText className="h-4 w-4 mr-2" />
                                        View PDF: {jsonData.current_active_file}
                                    </Button>
                                </div>
                            )}

                            {/* Reload data button */}
                            <div className="absolute bottom-4 left-40 z-10">
                                <Button
                                    variant="outline"
                                    className="bg-blue-50 hover:bg-blue-100"
                                    onClick={fetchGraphData}
                                    disabled={loading}
                                >
                                    {loading ? "Loading..." : "Reload Data"}
                                </Button>
                            </div>

                            {/* Chatbot Avatar */}
                            <div className="absolute bottom-4 right-4 z-10">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-full h-14 w-14 bg-blue-50 shadow-lg hover:shadow-xl transition-all"
                                    onClick={() => setChatOpen(true)}
                                >
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Study Buddy" />
                                        <AvatarFallback className="bg-blue-200 text-blue-800">SB</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </div>

                            {/* Chatbot Dialog */}
                            {chatOpen && (
                                <div className="absolute bottom-20 right-4 w-80 bg-white rounded-lg shadow-xl z-20 border overflow-hidden">
                                    <div className="flex items-center justify-between p-3 bg-blue-100">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Study Buddy" />
                                                <AvatarFallback className="bg-blue-200 text-blue-800">SB</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">Study Buddy</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <ScrollArea className="h-80 p-3">
                                        <div className="space-y-4">
                                            {chatMessages.map((message, index) => (
                                                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                                                    <div
                                                        className={`max-w-[80%] rounded-lg px-3 py-2 ${message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                                                            }`}
                                                    >
                                                        {message.content}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    <form onSubmit={handleChatSubmit} className="p-3 border-t">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Ask about machine learning topics..."
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                            />
                                            <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700">
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                <div className="mt-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Legend</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-sm">Completed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <span className="text-sm">Needs Improvement</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                                <span className="text-sm">Not Studied</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-[2px] bg-black"></div>
                                <span className="text-sm">Prerequisite</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-[1px] bg-black dashed"></div>
                                <span className="text-sm">Related Topic</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}
