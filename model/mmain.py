from mdata_generator import DataGenerator, load_generated_dataset
from mgraph_builder import GraphBuilder
from mdata_preprocessor import DataPreprocessor, load_preprocessed_dataset
import os
import json

def load_config(config_path: str):
    """
    Load configuration from a JSON file.
    """
    if config_path is None:
        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    # Try reading as UTF-8 first (common for JSON with Unicode). On Windows the
    # default encoding may be cp1252 which can raise UnicodeDecodeError for some
    # characters — fall back to cp1252 if needed.
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config
    except UnicodeDecodeError:
        with open(config_path, 'r', encoding='cp1252') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        raise
    except Exception:
        # Re-raise to surface parsing errors (invalid JSON etc.)
        raise

CONFIG_FILEPATH = './config/default_config.json'
# Control flags and default dataset paths (can be overridden by environment or external args)
IS_GENERATE_DATA = False
DATASET_FILEPATH = './data/generated-dataset_200-students_50-courses.json'
IS_PREPROCESS_DATA = False
PREPROCESSED_DATASET_FILEPATH = './data/preprocessed-dataset_200-students_50-courses.json'
VISUALIZED_STUDENT_IDS = [0]
VISUALIZED_NEIGHBOR_HOPS = 3

# Load configuration
config = load_config(config_path=CONFIG_FILEPATH)

# Global variables from config (use .get with sensible defaults to avoid KeyError)
NUM_STUDENT = config.get('NUM_STUDENT', 200)
NUM_COURSE = config.get('NUM_COURSE', 50)
AVG_ENROLLED_COURSES_PER_STUDENT = config.get('AVG_ENROLLED_COURSES_PER_STUDENT', 8)
AVG_WILL_ENROLL_COURSES_PER_STUDENT = config.get('AVG_WILL_ENROLL_COURSES_PER_STUDENT', 2)
GENERATED_FILEPATH_PREFIX = config.get('GENERATED_FILEPATH_PREFIX', './data/generated-dataset')
PREPROCESSED_FILEPATH_PREFIX = config.get('PREPROCESSED_FILEPATH_PREFIX', './data/preprocessed-dataset')
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
NUM_EPOCHS = config.get('NUM_EPOCHS', 100)
BATCH_SIZE = config.get('BATCH_SIZE', 256)
EARLY_STOPPING_PATIENCE = config.get('EARLY_STOPPING_PATIENCE', 10)
EARLY_STOPPING_MIN_DELTA = config.get('EARLY_STOPPING_MIN_DELTA', 0.0001)
VALIDATION_SPLIT = config.get('VALIDATION_SPLIT', 0.1)

# Evaluation / models
k_list = config.get('k_list', [1,3,5])
models_list = config.get('models_list', ['lightgcn','gcn','graphsage','kgat'])
EMBEDDING_DIM = config.get('EMBEDDING_DIM', 64)
NUM_LAYERS = config.get('NUM_LAYERS', 5)
EVAL_INTERVAL = config.get('EVAL_INTERVAL', 10)
TOP_K = config.get('TOP_K', 10)

def main():  
    
    # Step 1: Generate dataset if needed
    if IS_GENERATE_DATA:
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
        dataset = load_generated_dataset(filepath=DATASET_FILEPATH)
        print(f"\n[1] Loaded existing dataset from '{DATASET_FILEPATH}'")
        print(f"  - Students: {len(dataset['students'])}")
        print(f"  - Courses: {len(dataset['courses'])}")
        print(f"  - Enrollments: {len(dataset['enrollments'])}")
    
    # Step 2: Build and visualize knowledge graph and visualize
    knowledge_graph = GraphBuilder(dataset=dataset)
    knowledge_graph.build_graph(include_will_enroll=False,
                 is_save_gexf=True, built_graph_filepath_prefix='./data/built-graph')
    # Visualize a small subgraph for easier inspection
    small_subgraph = knowledge_graph.get_subgraph_for_students(VISUALIZED_STUDENT_IDS, radius=VISUALIZED_NEIGHBOR_HOPS)
    knowledge_graph.visualize(subgraph=small_subgraph, figsize=(10, 8), show_labels=True, node_size=200,
               is_save_img=True, visualized_graph_filepath_prefix='./data/visualized-graph',
               seed_students=VISUALIZED_STUDENT_IDS, hops=VISUALIZED_NEIGHBOR_HOPS)
		
    # Step 3: Preprocess dataset if needed
    if IS_PREPROCESS_DATA:
        preprocessed_data = DataPreprocessor.preprocess_data(
            dataset,
            max_semester=max(SEMESTER_LIST),
            gpa_scale=GPA_SCALE,
            num_majors=len(COURSE_MAJOR_CODE_LIST),
            is_save_json=True,
            preprocessed_filepath_prefix=PREPROCESSED_FILEPATH_PREFIX
        )
    else:
        preprocessed_data = load_preprocessed_dataset(filepath=PREPROCESSED_DATASET_FILEPATH)
        print(f"\n[2] Loaded existing preprocessed dataset from '{PREPROCESSED_DATASET_FILEPATH}'")
        print(f"  - Students: {len(preprocessed_data['students'])}")
        print(f"  - Courses: {len(preprocessed_data['courses'])}")
        print(f"  - Enrollments: {len(preprocessed_data['enrollments'])}")

    # Step 3: Train and evaluate models
    # results = train_and_evaluate_models(data)
    
    # Step 4: Show sample recommendations
    # student_id = 4
    # show_sample_recommendations(data, student_id, model_type='lightgcn')

    # # print "will_enroll" courses of student 0 to verify
    # student_will_enroll = [e for e in data['enrollments'] if e['student_id'] == student_id and e['is_enrolled'] == 0]
    # print(f"\n  Student {student_id} 'will_enroll' courses:")
    # for e in student_will_enroll:
    #     print(f"    Course ID: {e['course_id']}")
    
    # Step 5: Compare models
    # print_model_comparison(results)
    
if __name__ == "__main__":
    main()