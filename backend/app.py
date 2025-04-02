from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API设置
url = "https://gpt-api.hkust-gz.edu.cn/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "acb0f9d12f78421e81a921e55c5789bc4f64ba4f021949f087b6c48e7f16fcd2"
}

def get_section_prompt(section):
    prompts = {
        'idea': "You are a business discussion partner. Let's explore your business idea together. I'll help you think through: 1. What inspired this idea? 2. What problems does it solve? 3. What makes it unique? Share your thoughts and we can discuss further.",
        
        'painpoint': "You are a problem exploration partner. Let's discuss the pain points you've identified. Tell me about: 1. What specific problems have you observed? 2. Who experiences these problems? 3. How severe are these issues? Share your observations and we can explore deeper.",
        
        'market': "You are a market research partner. Let's explore the market potential together. Tell me about: 1. Who are your target customers? 2. What market trends have you noticed? 3. How large is the opportunity? Share your market insights and we can discuss further.",
        
        'product': "You are a product development partner. Let's discuss your product/service vision. Tell me about: 1. What key features are you planning? 2. How will users benefit? 3. What makes it different? Share your product ideas and we can explore together.",
        
        'competitive': "You are a competitive analysis partner. Let's explore the competitive landscape together. Tell me about: 1. Who are the key competitors? 2. What are their strengths and weaknesses? 3. How will you differentiate? Share your competitive insights and we can discuss further.",
        
        'feasibility': "You are an implementation planning partner. Let's discuss how to make this happen. Tell me about: 1. What resources do you need? 2. What challenges do you foresee? 3. What's your timeline? Share your implementation thoughts and we can explore together.",
        
        'financial': "You are a financial planning partner. Let's explore the financial aspects together. Tell me about: 1. How will you generate revenue? 2. What are the major costs? 3. What investments are needed? Share your financial thinking and we can discuss further.",
        
        'team': "You are a team planning partner. Let's discuss your team vision together. Tell me about: 1. What roles are essential? 2. What skills are needed? 3. How will you build the team? Share your team planning ideas and we can explore together."
    }
    return prompts.get(section, "You are a business planning partner. Let's explore this aspect of your business plan together. Share your thoughts and we can have a meaningful discussion about developing this section further.")

def format_response(text):
    # Split the text into lines
    lines = text.split('\n')
    formatted_lines = []
    
    for line in lines:
        # Remove any special characters at the start of lines
        line = line.strip()
        if line:
            # If line starts with a number, add a newline before it
            if any(line.startswith(f"{i}.") or line.startswith(f"{i}、") for i in range(1, 10)):
                formatted_lines.append('\n' + line)
            else:
                formatted_lines.append(line)
    
    # Join the lines back together
    formatted_text = ' '.join(formatted_lines)
    
    # Clean up extra spaces and newlines
    formatted_text = formatted_text.replace('  ', ' ').strip()
    
    return formatted_text

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        logger.info("\n=== New Request ===")
        logger.info("Request received...")
        data = request.json
        if not data:
            logger.error("No data received in request")
            return jsonify({
                'success': False,
                'error': 'No data received'
            }), 400

        user_message = data.get('message', '')
        section = data.get('section', '')
        
        if not user_message:
            logger.error("Empty message received")
            return jsonify({
                'success': False,
                'error': 'Empty message received'
            }), 400
        
        logger.info(f"Processing message: {user_message}")
        logger.info(f"Section: {section}")
        
        # Get section-specific prompt
        system_prompt = get_section_prompt(section)
        
        # Prepare the API request
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            "temperature": 0.7,
            "max_tokens": 800,
            "top_p": 0.9,
            "frequency_penalty": 0,
            "presence_penalty": 0
        }
        
        logger.info("Sending request to API...")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            logger.error(f"API request failed with status code: {response.status_code}")
            logger.error(f"Response content: {response.text}")
            return jsonify({
                'success': False,
                'error': f'API request failed with status code: {response.status_code}'
            }), 500
        
        # Parse the response
        response_data = response.json()
        if 'choices' not in response_data or not response_data['choices']:
            logger.error("No response choices found in API response")
            return jsonify({
                'success': False,
                'error': 'No response generated by the API'
            }), 500
        
        # Extract the assistant's message
        assistant_message = response_data['choices'][0]['message']['content']
        # Format the response
        formatted_message = format_response(assistant_message)
        logger.info(f"Formatted response: {formatted_message}")
        
        return jsonify({
            'success': True,
            'response': formatted_message
        })
            
    except requests.Timeout:
        logger.error("API request timed out")
        return jsonify({
            'success': False,
            'error': 'Request timed out'
        }), 504
    except requests.RequestException as e:
        logger.error(f"API request error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'API request error: {str(e)}'
        }), 500
    except Exception as e:
        logger.error(f"Error occurred: {str(e)}")
        logger.error(f"Detailed error: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("\n=== Starting Server ===")
    app.run(host='0.0.0.0', port=5000, debug=True) 