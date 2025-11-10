def print_json(data):
    import json
    print(json.dumps(data, indent=4))
    object = {
        "message" : "Hello, World!"
    }
    return json.dumps(object, indent=4)

if __name__ == "__main__":
    django_data = {
        "name": "Django",
        "type": "Web Framework",
        "language": "Python"
    }
    print_json(django_data)