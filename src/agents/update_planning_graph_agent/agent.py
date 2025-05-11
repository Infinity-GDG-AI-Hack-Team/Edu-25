import os
import sys

from google.adk.agents import Agent

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from db.client import MongoDBClient
from config import GOOGLE_API_KEY


def get_known_topics(student_id: int, project_name: str):
    """
    Get known topics from the database for a given student and project
    """
    client = MongoDBClient()
    students_col = client.select_collection('test1')
    student = students_col.find_one({'student_id': student_id, 'project_name': project_name})
    if student:
        return student.get('known_topics', [])
    return []

def get_keywords(known_topics: list):
    """
    Get keywords from the database for known topics for a given student and project
    """
    client = MongoDBClient()
    keywords_col = client.select_collection('keywords')

    known_keywords_knowledge = []
    for topic in known_topics:
        keywords = keywords_col.find({'keyword': topic.lower()})
        # sort keywords by knowledge level
        keywords = sorted(keywords, key=lambda x: x.get('knowledge_level', 0), reverse=True)

        # get top 5 keywords
        keywords = keywords[:5]

        # get knowledge level for each keyword and calculate average knowledge level
        if keywords:
            # get knowledge level for each keyword
            keyword_scores = []

            for keyword in keywords:
                knowledge_level = keyword.get('knowledge_level', 0)
                if knowledge_level > 0:
                    known_keywords_knowledge.append({
                        'keyword': keyword['keyword'],
                        'knowledge_level': knowledge_level
                    })
                    # add score to the list
                    keyword_scores.append(knowledge_level)
                else:
                    # if knowledge level is 0, add to the list with a score of 0
                    known_keywords_knowledge.append({
                        'keyword': keyword['keyword'],
                        'knowledge_level': 0
                    })
                    keyword_scores.append(0)
            # calculate average knowledge level for the topic
            avg_knowledge_level = sum(keyword_scores) / len(keyword_scores)
            # update the knowledge level for the topic

            for keyword in known_keywords_knowledge:
                if keyword['keyword'] == topic:
                    keyword['knowledge_level'] = avg_knowledge_level
                    break

    # sort by knowledge level
    known_keywords_knowledge.sort(key=lambda x: x['knowledge_level'], reverse=True)

    return known_keywords_knowledge

def update_student_knowledge_base(student_id: int, project_name: str):
    """
    Update the student knowledge base in the database by checking known topics and keywords semantic similarity.
    """
    # 1. Get known topics from the database
    known_topics = get_known_topics(student_id, project_name)
    print("Known topics:", known_topics)

    # 2. Get keywords from the database
    known_keywords_knowledge = get_keywords(known_topics)
    print("Known keywords and knowledge levels:", known_keywords_knowledge)

    if known_keywords_knowledge:
        # Update the planning graph in the database
        client = MongoDBClient()
        student_col = client.select_collection('test1')
        student_data = student_col.find_one({'student_id': student_id, 'project_name': project_name})

        if student_data:
            student_data['student_knowledge_base'] = []
            for keyword in known_keywords_knowledge:
                status = "Not Completed"
                if keyword['knowledge_level'] >= 0.9:
                    status = "Completed"
                elif 0.7 <= keyword['knowledge_level'] < 0.9:
                    status = "In Progress"
                elif 0 < keyword['knowledge_level'] < 0.7:
                    status = "Need Improvement"

                student_data['student_knowledge_base'].append({
                    'topic': keyword['keyword'],
                    'score': keyword['knowledge_level'],
                    'status': status
                })

            # Update the student knowledge base in the database
            print("Updating student knowledge base in the database...:", student_data['student_knowledge_base'])
            student_col.update_one(
                {'student_id': student_id, 'project_name': project_name},
                {'$set': {'student_knowledge_base': student_data['student_knowledge_base']}}
            )
        else:
            print("Student knowledge base does not exist")
            return False
    else:
        print("Student knowledge base does not exist")
        return False

    print("Student knowledge base updated")
    return True


def update_planning_graph(student_id: int, project_name: str):
    """
    Update the planning graph in the database by checking known topics and keywords semantic similarity in student knowledge base
    """
    if update_student_knowledge_base(student_id, project_name):
        print("Planning graph updated")
    else:
        print("No planning graph to update")
        return False

    # return the student knowledge base which will be used to update the planning graph at frontend
    client = MongoDBClient()
    student_col = client.select_collection('test1')
    student_data = student_col.find_one({'student_id': student_id, 'project_name': project_name})
    print("Student data-1:", student_data)
    if student_data:
        student_knowledge_base = student_data.get('student_knowledge_base', [])
        # sort by knowledge level
        student_knowledge_base.sort(key=lambda x: x['score'], reverse=True)
        return student_knowledge_base
    else:
        print("Student knowledge base does not exist")
        return False


# Agent to update the knowledge base and planning graph
root_agent = Agent(
    model='gemini-2.0-flash-001',
    name='knowledge_base_and_graph_updater',
    description='Agent to update the knowledge base and planning graph in the database by checking known topics and keywords semantic similarity.',
    instruction=(
            "You are an educational graph planner. When invoked, call the `update_planning_graph(student_id, project_name)` "
            "tool to retrieve the student knowledge base from the database and update the planning graph. "
        ),
    tools=[update_planning_graph]
)
