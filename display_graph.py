#!/usr/bin/env python3
import json
import sys

def print_graph_data(record):
    """
    Print MongoDB graph data with highlighted nodes and edges
    """
    print("\n" + "="*80)
    print(f"STUDENT INFO: ID={record.get('student_id', {}).get('$numberInt', 'N/A')}, PROJECT={record.get('project_name', 'N/A')}")
    print("="*80)

    # Extract graph data
    graph = record.get("planning_graph", {})
    nodes_id = graph.get("nodes_id", [])
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    # Print nodes
    print("\n\033[1;34m=== NODES ===\033[0m")
    node_mapping = {}
    for i, (node_id, node_label) in enumerate(zip(nodes_id, nodes)):
        node_mapping[node_id] = i
        print(f"\033[1;32m[{i}] {node_label}\033[0m (ID: {node_id})")

    # Print edges
    print("\n\033[1;34m=== EDGES ===\033[0m")
    for edge in edges:
        source_id, target_id = edge
        source_idx = node_mapping.get(source_id, "?")
        target_idx = node_mapping.get(target_id, "?")
        source_label = nodes[source_idx] if isinstance(source_idx, int) else "Unknown"
        target_label = nodes[target_idx] if isinstance(target_idx, int) else "Unknown"
        print(f"\033[1;33m[{source_idx}]\033[0m {source_label} → \033[1;33m[{target_idx}]\033[0m {target_label}")

    # Print known topics
    known_topics = record.get("known_topics", [])
    print("\n\033[1;34m=== KNOWN TOPICS ===\033[0m")
    for topic in known_topics:
        print(f"\033[1;36m•\033[0m {topic}")

    print("\n" + "="*80)

# Example usage with inline JSON
if __name__ == "__main__":
    # Use the provided JSON example
    example_json = """{"_id":{"$oid":"681f8e01efc025a0df256026"},"student_id":{"$numberInt":"11"},"project_name":"machine_learning_part-1","files":{"pdf":["Machine Learning-Chapter-1.pdf","Machine Learning-Chapter-2.pdf","Machine Learning-Chapter-3.pdf","Machine Learning-Chapter-4.pdf"]},"current_active_file":"Machine Learning-Chapter-1.pdf","student_knowledge_base":null,"planning_graph":{"nodes_id":["recognition_systems","1d_signals","semi_supervised_learning","ml_system_design_phases","automatic_fish_packing_classification","bayesian_estimation","non_parametric_estimation","knn_estimation","parzen_window_density_estimates","em_algorithm","feature_reduction","hughes_effect","statistical_separability_measures","sequential_forward_backward_strategy","pca","lda","supervised_classification","bayesian_classification","minimum_risk_theory","discriminant_functions","decision_trees","confusion_matrix"],"nodes":["Recognition Systems","1-D Signals","Semi-supervised Learning","ML System Design Phases","Automatic Fish-Packing Classification","Bayesian Estimation","Non-parametric Estimation","K-NN Estimation","Parzen Window Density Estimates","EM Algorithm","Feature Reduction","Hughes Effect","Statistical Separability Measures","Sequential Forward/Backward Strategy","Principal Component Analysis (PCA)","Linear Discriminant Analysis (LDA)","Supervised Classification","Bayesian Classification","Minimum Risk Theory","Discriminant Functions","Decision Trees","Confusion Matrix"],"edges":[["ml_system_design_phases","automatic_fish_packing_classification"],["bayesian_estimation","em_algorithm"],["feature_reduction","pca"],["feature_reduction","lda"],["supervised_classification","bayesian_classification"],["bayesian_classification","minimum_risk_theory"],["minimum_risk_theory","discriminant_functions"],["discriminant_functions","decision_trees"]],"sequence":["recognition_systems","1d_signals","semi_supervised_learning","ml_system_design_phases","automatic_fish_packing_classification","bayesian_estimation","non_parametric_estimation","knn_estimation","parzen_window_density_estimates","em_algorithm","feature_reduction","hughes_effect","statistical_separability_measures","sequential_forward_backward_strategy","pca","lda","supervised_classification","bayesian_classification","minimum_risk_theory","discriminant_functions","decision_trees","confusion_matrix"]},"known_topics":["Recognition Systems","1d Signals"]}"""

    try:
        # Parse the example JSON
        record = json.loads(example_json)
        print_graph_data(record)

    except Exception as e:
        print(f"Error: {e}")
