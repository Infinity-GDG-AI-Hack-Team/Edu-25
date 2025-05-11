from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import google_search
from google.genai import types
import json
from google.adk.agents import Agent, SequentialAgent
from pydantic import BaseModel, Field

from .planner import generate_study_graph, save_study_graph


class StudyGraph(BaseModel):
    """
    Represents a study graph with nodes, edges, and a sequence.
    """
    nodes_id: list[str] = Field(description="List of topic IDs in the study graph., node name lowercased")
    nodes: list[str] = Field(description="List of topics (nodes) in the study graph.")
    edges: list[list[str]] = Field(description="List of prerequisite relationships in the format [source, target].")
    sequence: list[str] = Field(description="Proposed optimal study sequence.")


# Wrap planner for ADK tool signature
def plan_study_graph(std_id: int, project_name: str):
    """
    ADK tool: generate a study graph plan based on a student's PDF content.
    """
    return generate_study_graph(std_id, project_name)

def save_study_graph_to_db(std_id: int, project_name: str, graph_plan_json: str):
    """
    ADK tool: save the generated study graph json to the database.
    """
    try:
        # Convert the graph_plan_json to a Python dictionary
        graph_plan_dict = json.loads(graph_plan_json)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return None

    return save_study_graph(std_id, project_name, graph_plan_dict)


get_context_agent = Agent(
    name="get_context_agent",
    model="gemini-2.0-flash-001",
    description="Gets the context used to generate the graph using the plan study graph tool.",
    instruction=(
        "You are an educational planner. When invoked, call the `plan_study_graph(student_id, project_name)` "
        "tool to retrieve a structured graph of topics and dependencies"
    ),
    tools=[plan_study_graph],
)

extract_graph_agent_prompt= (
        "You are an expert curriculum designer. Based on the following extracted PDF content snippets, "
        "identify the key topics as nodes, specify prerequisite relationships as edges, "
        "and propose an optimal study sequence. Output in JSON with 'nodes', 'edges', 'sequence'."
        f"Content Snippets:"
    )
# Create extraction agent
extract_graph_agent = Agent(
    model='gemini-2.0-flash-001',
    name='extract_graph_agent',
    description='An agent that generated graphs.',
    instruction=extract_graph_agent_prompt,
    output_schema=StudyGraph, # Enforce JSON output
    output_key="extracted_graph"  # Store result in state['found_capital']
)

# Agent to save the standard study graph to the database
save_graph_agent = Agent(
    name='save_graph_agent',
    model='gemini-2.0-flash-001',
    description="Saves the generated study graph to the database.",
    instruction=(
        "You are a database manager. When invoked, save the generated study graph to the database."
    ),
    tools=[save_study_graph_to_db],
)


APP_NAME="graph_sequential_agent"
USER_ID="user1234"
SESSION_ID="1234"

# Create sequential agent that combines both agents
root_agent = SequentialAgent(
    name='graphq_sequential_agent',
    description="Generates a concept dependency graph and recommended study sequence based on course PDFs.",
    sub_agents=[get_context_agent, extract_graph_agent],
)


# Session and Runner
session_service = InMemorySessionService()
session = session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)
runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=session_service)


# Agent Interaction
def call_agent(query):
    """
    Helper function to call the agent with a query.
    """
    content = types.Content(role='user', parts=[types.Part(text=query)])
    events = runner.run(user_id=USER_ID, session_id=SESSION_ID, new_message=content)

    # load query text into dict
    query_dict = json.loads(query)
    # get student_id and project_name
    student_id = query_dict.get('student_id')
    project_name = query_dict.get('project_name')

    for event in events:
        if event.is_final_response():
            final_response = event.content.parts[0].text
            print("Final response: ", final_response)
            # convert to JSON
            try:
                json_response = json.loads(final_response)
                # if it has nodes_id, nodes, edges, sequence
                if all(key in json_response for key in ['nodes_id', 'nodes', 'edges', 'sequence']):
                    # save the graph to the database
                    save_graph_response = save_study_graph_to_db(student_id, project_name, json.dumps(json_response))
                    if save_graph_response:
                        print("Graph saved successfully to the database.")
                    else:
                        print("Failed to save graph to the database.")

                else:
                    print("Unexpected JSON structure: ", json_response)

            except json.JSONDecodeError as e:
                pass
