import sys
import os
import argparse

# Ensure the node_agent directory is in the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "node_agent"))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Start a NebulaAI Compute Node.")
    parser.add_argument('--server-url', default=None, 
                        help='URL of the Orchestrator (e.g., http://192.168.1.50:8000)')
    args, unknown = parser.parse_known_args()

    # If --server-url is passsed, set it in the environment variable.
    # The config.py inside node_agent reads this automatically.
    if args.server_url:
        os.environ['SERVER_URL'] = args.server_url

    import node_agent
    node_agent.main()
