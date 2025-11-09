from data_generator import DataGenerator
from graph_builder import GraphBuilder
from data_preprocessor import DataPreprocessor
from data_loader import DataLoader
from model import CourseRecommendationModel

CONFIG_FILEPATH = './config/default_config.json'

IS_GENERATE_DATA = False
DATASET_FILEPATH = './data/generated-dataset_500-students_150-courses.json'

IS_PREPROCESS_DATA = False
PREPROCESSED_DATASET_FILEPATH = './data/preprocessed-dataset_500-students_150-courses.json'

IS_VISUALIZE_GRAPH = False
VISUALIZED_STUDENT_IDS = [0]
VISUALIZED_NEIGHBOR_HOPS = 2

IS_TRAIN_MODEL = False
IS_EVAL_MODEL = True

IS_RECOMMEND_COURSES = True
RECOMMENDATION_REQUESTED_FILEPATH = './requests/recommendation_requests.json'
IS_SAVE_RECOMMENDATIONS = True

# Load configuration
config = DataLoader.load_config(config_path=CONFIG_FILEPATH)

# Global variables from config (use .get with sensible defaults to avoid KeyError)
NUM_STUDENT = config.get('NUM_STUDENT', 500)
NUM_COURSE = config.get('NUM_COURSE', 150)
AVG_ENROLLED_COURSES_PER_STUDENT = config.get('AVG_ENROLLED_COURSES_PER_STUDENT', 8)
AVG_WILL_ENROLL_COURSES_PER_STUDENT = config.get('AVG_WILL_ENROLL_COURSES_PER_STUDENT', 2)

GENERATED_FILEPATH_PREFIX = config.get('GENERATED_FILEPATH_PREFIX', './data/generated-dataset')
PREPROCESSED_FILEPATH_PREFIX = config.get('PREPROCESSED_FILEPATH_PREFIX', './data/preprocessed-dataset')
TRAINED_MODEL_FILEPATH = config.get('TRAINED_MODEL_FILEPATH', './model/course_recommendation_model.pth')
RECOMMENDATIONS_FILEPATH_PREFIX = config.get('RECOMMENDATIONS_FILEPATH_PREFIX', './data/recommendations')

STUDENT_CODE_LENGTH = config.get('STUDENT_CODE_LENGTH', 8)
STUDENT_MAJOR_CODE_LIST = config.get('STUDENT_MAJOR_CODE_LIST', [])
SEMESTER_LIST = config.get('SEMESTER_LIST', [1,4,7,10])
GPA_SCALE = config.get('GPA_SCALE', 10.0)
DEFAULT_IMAGE_URL = config.get('DEFAULT_IMAGE_URL', '')
INIT_SEMESTER_BY_STUDENT_CODE_PREFIX = config.get('INIT_SEMESTER_BY_STUDENT_CODE_PREFIX', {})
COURSE_CODE_LENGTH = config.get('COURSE_CODE_LENGTH', 8)
COURSE_NAME_PREFIX_LIST = config.get('COURSE_NAME_PREFIX_LIST', [])
COURSE_MAJOR_CODE_LIST = config.get('COURSE_MAJOR_CODE_LIST', [])
SEMESTER_RANGE = config.get('SEMESTER_RANGE', [1,12])
CREDIT_LIST = config.get('CREDIT_LIST', [2,4,6])
WEIGHT_VALUES = config.get('WEIGHT_VALUES', [0.0,0.25,0.5,1.0])
ENROLLMENT_LIST = config.get('ENROLLMENT_LIST', ['liked','disliked','will_enroll'])

# Mappings and encodings
ONEHOT_STUDENT_MAJOR = config.get('ONEHOT_STUDENT_MAJOR', {})
MANYHOTS_COURSE_MAJOR = config.get('MANYHOTS_COURSE_MAJOR', {})
ENROLLMENT_WEIGHT = config.get('ENROLLMENT_WEIGHT', {'liked':1.0,'disliked':-1.0,'will_enroll':0.5})

# Training / evaluation params
NUM_EPOCHS = config.get('NUM_EPOCHS', 1000)
BATCH_SIZE = config.get('BATCH_SIZE', 256)
NUM_NEGATIVE = config.get('NUM_NEGATIVE', 5)
TEST_SPLIT = config.get('TEST_SPLIT', 0.2)
VALID_SPLIT = config.get('VALID_SPLIT', 0.1)

EARLY_STOPPING_PATIENCE = config.get('EARLY_STOPPING_PATIENCE', 10)
EARLY_STOPPING_MIN_DELTA = config.get('EARLY_STOPPING_MIN_DELTA', 0.0001)

# Evaluation / models
K_LIST = config.get('K_LIST', [1,3,5])
EMBEDDING_DIM = config.get('EMBEDDING_DIM', 128)
NUM_LAYERS = config.get('NUM_LAYERS', 5)
EVAL_INTERVAL = config.get('EVAL_INTERVAL', 10)
TOP_K = config.get('TOP_K', 10)

def main():  
    
    # Step 1: Generate dataset if needed
    if IS_GENERATE_DATA:
        print(f"\n[1] Generating synthetic dataset...")
        # Use the corrected generate_dataset staticmethod from mdata_generator
        dataset = DataGenerator.generate_data(
            num_student=NUM_STUDENT,
            num_course=NUM_COURSE,
            avg_enrolled_courses_per_student=AVG_ENROLLED_COURSES_PER_STUDENT,
            avg_will_enroll_courses_per_student=AVG_WILL_ENROLL_COURSES_PER_STUDENT,
            student_code_length=STUDENT_CODE_LENGTH,
            student_major_code_list=STUDENT_MAJOR_CODE_LIST,
            semester_list=SEMESTER_LIST,
            gpa_scale=GPA_SCALE,
            default_image_url=DEFAULT_IMAGE_URL,
            init_semester_by_student_code_prefix=INIT_SEMESTER_BY_STUDENT_CODE_PREFIX,
            course_code_length=COURSE_CODE_LENGTH,
            course_name_prefix_list=COURSE_NAME_PREFIX_LIST,
            course_major_code_list=COURSE_MAJOR_CODE_LIST,
            semester_range=SEMESTER_RANGE,
            credit_list=CREDIT_LIST,
            weight_values=WEIGHT_VALUES,
            enrollment_list=ENROLLMENT_LIST,
            is_save_json=True,
            generated_filepath_prefix=GENERATED_FILEPATH_PREFIX
        )
    else:
        # Load existing dataset
        dataset = DataLoader.load_generated_dataset(filepath=DATASET_FILEPATH)
        print(f"\n[1] Loaded existing dataset from '{DATASET_FILEPATH}'")
        print(f"  - Students: {len(dataset['students'])}")
        print(f"  - Courses: {len(dataset['courses'])}")
        print(f"  - Enrollments: {len(dataset['enrollments'])}")
    
    # Step 2: Build and visualize knowledge graph and visualize
    if IS_VISUALIZE_GRAPH:
        print(f"\n[2] Building and visualizing knowledge graph...")
        graph_builder = GraphBuilder(data=dataset, unenrolled_rate=0.0)
        knowledge_graph = graph_builder.build_visualization_graph(include_will_enroll=False,
                    is_save_gexf=True, built_graph_filepath_prefix='./data/built-graph')
        # Visualize a small subgraph for easier inspection
        small_subgraph = graph_builder.get_subgraph_for_students(knowledge_graph,
                                                                VISUALIZED_STUDENT_IDS, radius=VISUALIZED_NEIGHBOR_HOPS)
        graph_builder.visualize(small_subgraph, figsize=(10, 8), show_labels=True, node_size=200,
                is_save_img=True, visualized_graph_filepath_prefix='./data/visualized-graph',
                seed_students=VISUALIZED_STUDENT_IDS, hops=VISUALIZED_NEIGHBOR_HOPS)
		
    # Step 3: Preprocess dataset if needed
    if IS_PREPROCESS_DATA:
        print(f"\n[3] Preprocessing dataset...")
        preprocessed_data = DataPreprocessor.preprocess_data(
            dataset,
            max_semester=max(SEMESTER_LIST),
            gpa_scale=GPA_SCALE,
            num_majors=len(COURSE_MAJOR_CODE_LIST),
            is_save_json=True,
            preprocessed_filepath_prefix=PREPROCESSED_FILEPATH_PREFIX
        )
    else:
        preprocessed_data = DataLoader.load_preprocessed_dataset(filepath=PREPROCESSED_DATASET_FILEPATH)
        print(f"\n[3] Loaded existing preprocessed dataset from '{PREPROCESSED_DATASET_FILEPATH}'")
        print(f"  - Students: {len(preprocessed_data['students'])}")
        print(f"  - Courses: {len(preprocessed_data['courses'])}")
        print(f"  - Enrollments: {len(preprocessed_data['enrollments'])}")

    # Step 4: Train model
    model = CourseRecommendationModel(data=preprocessed_data, embedding_dim=EMBEDDING_DIM, num_layers=NUM_LAYERS,
                 using_unenrolled_for_test=True, unenrolled_rate_in_graph=0.0,
                 test_split=TEST_SPLIT, valid_split=VALID_SPLIT)
    if IS_TRAIN_MODEL:
        print(f"\n[4] Training model...")
        model.train(num_epochs=NUM_EPOCHS, batch_size=BATCH_SIZE,
                num_negative=NUM_NEGATIVE,
                is_eval_during_training=True, ks=K_LIST,
                is_save_model=True, filepath=TRAINED_MODEL_FILEPATH)
    else:
        model.load_model(TRAINED_MODEL_FILEPATH)
        print(f"\n[4] Loaded trained model from '{TRAINED_MODEL_FILEPATH}'")

    # Step 5: Evaluate model if needed
    if IS_EVAL_MODEL:
        print(f"\n[5] Evaluating model on test set...")
        evaluation = model.evaluate(ks=K_LIST)
        print("  Evaluation Results:")
        for k in K_LIST:
            recall = evaluation.get(f'recall@{k}', 0.0)
            ndcg = evaluation.get(f'ndcg@{k}', 0.0)
            print(f"    Recall@{k}: {recall:.4f}, NDCG@{k}: {ndcg:.4f}")

    # Step 6: Show sample recommendations
    if IS_RECOMMEND_COURSES:
        # Load recommendation requests from file
        recommendation_requests = DataLoader.load_recommendation_requests(filepath=RECOMMENDATION_REQUESTED_FILEPATH)
        print(f"\n[6] Generating recommendations for {len(recommendation_requests)} request(s)...")
        
        for idx, request in enumerate(recommendation_requests, start=1):
            student_id = request.get('student_id')
            semester_filter = request.get('semester_filter')
            
            if student_id is None or semester_filter is None:
                print(f"  Request {idx}: Skipping - missing student_id or semester_filter")
                continue
            
            recommendations = model.recommend_courses(student_id, semester_filter, k=TOP_K,
                                                    is_save_recommendations=IS_SAVE_RECOMMENDATIONS, 
                                                    filepath_prefix=RECOMMENDATIONS_FILEPATH_PREFIX)
            print(f"\n  Request {idx}: Student ID {student_id}, Semester Filter {semester_filter}")
            print(f"  Top {TOP_K} recommended courses:")
            # recommendations is a list of dicts: {'rank': int, 'course_id': int, 'score': float}
            for rec in recommendations:
                try:
                    rank = int(rec.get('rank', 0))
                    course_id = int(rec.get('course_id'))
                    score = float(rec.get('score'))
                    print(f"    Rank {rank}: Course ID {course_id} with score {score:.4f}")
                except Exception:
                    # Fallback in case structure changes
                    print(f"    {rec}")

        if IS_SAVE_RECOMMENDATIONS:
            print(f"\n  Recommendations saved to files with prefix '{RECOMMENDATIONS_FILEPATH_PREFIX}'")
    
if __name__ == "__main__":
    main()