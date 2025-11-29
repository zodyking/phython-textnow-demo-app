"""
Python service for pythontextnow API integration
This service can be called from Next.js API routes using child_process or HTTP requests
"""

import json
import sys
import os
import re
from typing import Dict, List, Any

# Disable color output and ensure clean stdout
os.environ['NO_COLOR'] = '1'
os.environ['PYTHONUNBUFFERED'] = '1'

# Redirect stderr to devnull to prevent any error messages from interfering
# We'll handle errors in our JSON response instead
class DevNull:
    def write(self, *args, **kwargs):
        pass
    def flush(self, *args, **kwargs):
        pass

# Only redirect stderr if we're being called from Node.js (not interactive)
if not sys.stdin.isatty():
    sys.stderr = DevNull()

try:
    from pythontextnow import Client, ConversationService
    import requests
except ImportError:
    error_msg = json.dumps({"error": "pythontextnow not installed. Run: pip install pythontextnow"})
    print(error_msg, file=sys.stderr)
    print(error_msg)
    sys.exit(1)


class TextNowService:
    def __init__(self, username: str, sid_cookie: str, user_agent: str = None):
        """Initialize TextNow client
        
        Args:
            username: TextNow username
            sid_cookie: connect.sid cookie value
            user_agent: User agent string from browser (required per GitHub issue #39)
        """
        try:
            # Clean the SID cookie - it might have extra formatting
            # The cookie should be just the value, not "connect.sid=value"
            clean_sid = sid_cookie.strip()
            if clean_sid.startswith('connect.sid='):
                clean_sid = clean_sid.replace('connect.sid=', '').strip()
            if clean_sid.startswith('"') and clean_sid.endswith('"'):
                clean_sid = clean_sid[1:-1]
            
            # According to GitHub issue #35, the cookie should be URL-encoded
            # Keep it as-is if it contains % encoding, otherwise it's already decoded
            # The library expects the cookie value as it appears in the browser (URL-encoded)
            
            # Ensure the cookie value is properly formatted
            # It should start with 's%3A' (URL-encoded 's:') or 's:'
            if not clean_sid.startswith('s%3A') and not clean_sid.startswith('s:'):
                # If it doesn't start correctly, it might be malformed
                pass  # Let the library handle validation
            
            # According to GitHub issue #39, we need the EXACT user agent from the browser
            # Patch the requests session to use the exact user agent
            if user_agent:
                # Monkey-patch the default headers for requests
                # This ensures all requests use the exact user agent from the browser
                original_request = requests.Session.request
                def patched_request(self, method, url, **kwargs):
                    if 'headers' not in kwargs:
                        kwargs['headers'] = {}
                    if 'User-Agent' not in kwargs['headers']:
                        kwargs['headers']['User-Agent'] = user_agent
                    return original_request(self, method, url, **kwargs)
                requests.Session.request = patched_request
            
            Client.set_client_config(username=username, sid_cookie=clean_sid)
            self.username = username
            self.sid_cookie = clean_sid
            self.user_agent = user_agent
        except Exception as e:
            raise Exception(f"Failed to initialize TextNow client: {str(e)}")

    def send_sms(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Send an SMS message"""
        try:
            # Phone number must be in E.164 format
            conversation_service = ConversationService(conversation_phone_numbers=[phone_number])
            conversation_service.send_message(message=message)
            return {"success": True, "message": "Message sent successfully"}
        except Exception as e:
            error_msg = str(e)
            error_lower = error_msg.lower()
            
            # Provide more helpful error messages based on GitHub issue #35
            if "403" in error_msg or "forbidden" in error_lower:
                return {
                    "success": False, 
                    "error": "403 Forbidden: Your SID cookie may be invalid or expired. Common causes:\n1. Cookie has expired - get a fresh one from TextNow.com\n2. Cookie format is incorrect - make sure it starts with 's%3A'\n3. Username doesn't match - verify your TextNow username is correct\n\nGo to Settings to update your cookie."
                }
            elif "401" in error_msg or "unauthorized" in error_lower:
                return {
                    "success": False,
                    "error": "401 Unauthorized: Please check your TextNow username and SID cookie are correct. The username must match exactly (case-sensitive)."
                }
            return {"success": False, "error": error_msg}

    def send_media(self, phone_number: str, file_path: str) -> Dict[str, Any]:
        """Send media (image, video, GIF) only. Message should be sent separately."""
        try:
            # Verify file exists
            if not os.path.exists(file_path):
                return {"success": False, "error": f"File not found: {file_path}"}
            
            conversation_service = ConversationService(conversation_phone_numbers=[phone_number])
            # Send the media
            conversation_service.send_media(file_path=file_path)
            
            return {"success": True, "message": "Media sent successfully"}
        except Exception as e:
            error_msg = str(e)
            error_lower = error_msg.lower()
            
            # Provide helpful error messages
            if "403" in error_msg or "forbidden" in error_lower:
                return {
                    "success": False, 
                    "error": "403 Forbidden: Your SID cookie may be invalid or expired. Get a fresh cookie from TextNow.com and update your settings."
                }
            elif "401" in error_msg or "unauthorized" in error_lower:
                return {
                    "success": False,
                    "error": "401 Unauthorized: Please check your TextNow username and SID cookie are correct."
                }
            return {"success": False, "error": error_msg}

    def get_messages(self, phone_number: str = None, num_messages: int = 50) -> List[Dict[str, Any]]:
        """Get messages from a conversation"""
        try:
            result = []
            
            if phone_number:
                # Get messages from specific conversation
                # Phone number must be in E.164 format
                conversation_service = ConversationService(conversation_phone_numbers=[phone_number])
                messages_generator = conversation_service.get_messages(num_messages=num_messages)
                
                for message_list in messages_generator:
                    if not message_list:
                        continue
                    for msg in message_list:
                        try:
                            # Use pythontextnow Message object attributes correctly
                            # According to GitHub: message.from_, message.to, message.date, message.content
                            msg_id = getattr(msg, 'id', None) or getattr(msg, 'message_id', None) or getattr(msg, '_id', None)
                            
                            # Get content - the library uses 'content' attribute
                            msg_content = getattr(msg, 'content', None) or ''
                            
                            # Get date - the library returns datetime objects
                            from datetime import datetime
                            msg_date = getattr(msg, 'date', None)
                            if msg_date:
                                if hasattr(msg_date, 'isoformat'):
                                    msg_date = msg_date.isoformat()
                                elif hasattr(msg_date, 'strftime'):
                                    msg_date = msg_date.strftime('%Y-%m-%dT%H:%M:%S')
                                elif isinstance(msg_date, (int, float)):
                                    # Handle timestamp
                                    if msg_date > 1e10:
                                        msg_date = datetime.fromtimestamp(msg_date / 1000).isoformat()
                                    else:
                                        msg_date = datetime.fromtimestamp(msg_date).isoformat()
                                else:
                                    msg_date = str(msg_date)
                            else:
                                # Use current time as fallback to avoid invalid dates
                                msg_date = datetime.now().isoformat()
                            
                            # Get from/to - the library uses 'from_' (with underscore) and 'to'
                            msg_from = getattr(msg, 'from_', None) or getattr(msg, 'from', None) or ''
                            msg_to = getattr(msg, 'to', None) or ''
                            
                            # Determine direction and phone number
                            # For received messages, 'from_' contains the sender's number
                            # For sent messages, 'to' contains the recipient's number
                            is_sent = bool(msg_to and msg_to != phone_number) or getattr(msg, 'is_sent', False)
                            direction = "SENT" if is_sent else "RECEIVED"
                            
                            # Use the appropriate phone number based on direction
                            if direction == "RECEIVED":
                                # For received messages, use 'from_' as the phone number
                                message_phone = msg_from if msg_from else phone_number
                            else:
                                # For sent messages, use 'to' as the phone number
                                message_phone = msg_to if msg_to else phone_number
                            
                            # If we still don't have a phone number, use the conversation phone number
                            if not message_phone:
                                message_phone = phone_number
                            
                            # Ensure content is a string (handle None, empty, or other types)
                            content_str = ''
                            if msg_content:
                                content_str = str(msg_content).strip()
                            
                            msg_data = {
                                "id": str(msg_id) if msg_id else None,
                                "content": content_str,
                                "number": str(message_phone) if message_phone else '',
                                "date": msg_date if msg_date else '',
                                "read": getattr(msg, 'read', False) or getattr(msg, 'is_read', False),
                                "direction": direction,
                                "type": "MULTIMEDIA" if (getattr(msg, 'media_url', None) or getattr(msg, 'media', None)) else "MESSAGE",
                            }
                            
                            # Debug: Log if content is missing for text messages
                            if msg_data["type"] == "MESSAGE" and not content_str:
                                # Try alternative attributes
                                alt_content = (
                                    getattr(msg, 'text', None) or 
                                    getattr(msg, 'body', None) or 
                                    getattr(msg, 'message', None) or
                                    ''
                                )
                                if alt_content:
                                    msg_data["content"] = str(alt_content).strip()
                            
                            # Add media URL if present
                            if hasattr(msg, 'media_url') and msg.media_url:
                                msg_data["media_url"] = str(msg.media_url)
                            elif hasattr(msg, 'media') and msg.media:
                                msg_data["media_url"] = str(msg.media)
                                
                            result.append(msg_data)
                        except Exception as e:
                            # Skip individual message errors but continue processing
                            import traceback
                            # Log the error for debugging
                            continue
            else:
                # Get all messages from all conversations
                # According to GitHub, we need to get conversations first, then get messages from each
                # But the library might not have a direct way to get all conversations
                # So we'll use the direct API call but parse it using the library's Message structure if possible
                try:
                    # Get client config to access the API
                    client_config = Client.get_client_config()
                    username = client_config.get('username')
                    sid_cookie = client_config.get('sid_cookie')
                    
                    if not username or not sid_cookie:
                        return []
                    
                    # Make direct API call to TextNow to get all messages
                    # TextNow API endpoint: https://www.textnow.com/api/users/{username}/messages
                    api_url = f"https://www.textnow.com/api/users/{username}/messages"
                    
                    # Prepare headers with user agent
                    headers = {
                        'Cookie': f'connect.sid={sid_cookie}',
                        'Content-Type': 'application/json',
                    }
                    if self.user_agent:
                        headers['User-Agent'] = self.user_agent
                    
                    # Make request to get all messages
                    response = requests.get(api_url, headers=headers, timeout=30)
                    
                    if response.status_code == 200:
                        data = response.json()
                        messages_data = data.get('messages', []) or data.get('data', []) or []
                        
                        # DEBUG: Output FULL first message structure to help diagnose parsing issues
                        # This will be included in the JSON output so we can see it
                        debug_info = {
                            "debug_total_messages": len(messages_data),
                            "debug_response_keys": list(data.keys()) if isinstance(data, dict) else [],
                            "debug_response_structure": str(type(data))
                        }
                        if messages_data and len(messages_data) > 0:
                            first_msg = messages_data[0]
                            if isinstance(first_msg, dict):
                                # Output the FULL first message (all fields) so we can see the exact structure
                                import json as json_module
                                debug_info.update({
                                    "debug_first_message_keys": list(first_msg.keys()),
                                    "debug_first_message_full": json_module.dumps(first_msg, default=str, indent=2),  # Full message as JSON string
                                    "debug_all_message_keys": set()  # Collect all unique keys from all messages
                                })
                                # Collect all unique keys from first 5 messages
                                for msg in messages_data[:5]:
                                    if isinstance(msg, dict):
                                        debug_info["debug_all_message_keys"].update(msg.keys())
                                debug_info["debug_all_message_keys"] = list(debug_info["debug_all_message_keys"])
                        else:
                            # Even if no messages, include info about the response
                            import json as json_module
                            debug_info["debug_no_messages"] = True
                            debug_info["debug_full_response"] = json_module.dumps(data, default=str, indent=2)[:1000]  # First 1000 chars
                        
                        # Process messages - focus on received messages
                        for msg_data in messages_data:
                            try:
                                # Extract message information
                                msg_id = msg_data.get('id') or msg_data.get('message_id') or msg_data.get('_id')
                                msg_content = msg_data.get('content') or msg_data.get('message') or msg_data.get('text') or msg_data.get('body') or ''
                                
                                # Extract phone number - for received messages, it's usually in 'contact_value', 'from', or 'contact_number'
                                # TextNow API structure varies, so check multiple fields
                                # Try to get phone number from nested contact object first
                                contact_obj = msg_data.get('contact', {})
                                if isinstance(contact_obj, dict):
                                    phone_number = contact_obj.get('value') or contact_obj.get('number') or contact_obj.get('phone_number') or ''
                                
                                # If not found in nested object, try top-level fields
                                if not phone_number:
                                    phone_number = (
                                        msg_data.get('contact_value') or 
                                        msg_data.get('from') or 
                                        msg_data.get('from_number') or
                                        msg_data.get('contact_number') or 
                                        msg_data.get('number') or 
                                        msg_data.get('phone_number') or
                                        msg_data.get('to') or  # Sometimes 'to' field for received messages
                                        ''
                                    )
                                
                                # Clean phone number - remove any formatting but keep + and digits
                                if phone_number:
                                    import re
                                    # Keep + and digits only
                                    cleaned = re.sub(r'[^\d+]', '', str(phone_number))
                                    if cleaned:
                                        phone_number = cleaned
                                
                                # Extract date - try multiple field names
                                # TextNow API might use different date field names
                                msg_date = (
                                    msg_data.get('read_at') or
                                    msg_data.get('created_at') or
                                    msg_data.get('date') or 
                                    msg_data.get('timestamp') or 
                                    msg_data.get('time') or
                                    msg_data.get('sent_at') or
                                    msg_data.get('received_at') or
                                    msg_data.get('updated_at') or
                                    ''
                                )
                                
                                # Also check nested objects for date
                                if not msg_date:
                                    contact = msg_data.get('contact', {})
                                    if isinstance(contact, dict):
                                        msg_date = contact.get('date') or contact.get('timestamp') or contact.get('created_at') or ''
                                
                                # Convert date to ISO format if needed
                                if isinstance(msg_date, (int, float)):
                                    from datetime import datetime
                                    # Handle both milliseconds and seconds
                                    if msg_date > 1e10:
                                        msg_date = datetime.fromtimestamp(msg_date / 1000).isoformat()
                                    else:
                                        msg_date = datetime.fromtimestamp(msg_date).isoformat()
                                elif hasattr(msg_date, 'isoformat'):
                                    msg_date = msg_date.isoformat()
                                elif isinstance(msg_date, str):
                                    # If it's already a string, try to parse it
                                    if not msg_date or msg_date.strip() == '':
                                        msg_date = datetime.now().isoformat()
                                    else:
                                        # If it's a valid ISO string, keep it
                                        # Otherwise, try to parse common formats
                                        try:
                                            # Try parsing common date formats
                                            for fmt in ['%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d']:
                                                try:
                                                    parsed = datetime.strptime(msg_date, fmt)
                                                    msg_date = parsed.isoformat()
                                                    break
                                                except:
                                                    continue
                                        except:
                                            # If parsing fails, use current time
                                            msg_date = datetime.now().isoformat()
                                
                                # If still no date, use current time as fallback
                                if not msg_date or msg_date == '':
                                    msg_date = datetime.now().isoformat()
                                
                                # Determine direction - check multiple fields
                                # TextNow API: received messages have 'from' field with sender's number
                                # Sent messages have 'to' field or 'contact_value' matches our number
                                is_sent = (
                                    msg_data.get('is_sent', False) or 
                                    msg_data.get('direction', '').upper() == 'SENT' or
                                    msg_data.get('from') == username or
                                    msg_data.get('from_number') == username or
                                    (msg_data.get('contact_value') == username) or
                                    (not msg_data.get('from') and msg_data.get('to'))  # If no 'from', likely sent
                                )
                                direction = "SENT" if is_sent else "RECEIVED"
                                
                                # Only include received messages when getting all messages
                                if direction != "RECEIVED":
                                    continue
                                
                                # For received messages, ensure we have the sender's number
                                if not phone_number and direction == "RECEIVED":
                                    # Try to get from 'from' field if we haven't already
                                    phone_number = msg_data.get('from') or msg_data.get('from_number') or ''
                                
                                # Check if read
                                is_read = msg_data.get('read', False) or msg_data.get('is_read', False) or msg_data.get('read_status', False)
                                
                                # Check if media
                                has_media = bool(msg_data.get('media_url') or msg_data.get('media') or msg_data.get('attachment') or msg_data.get('mms'))
                                
                                # Only add message if we have essential data
                                if not phone_number:
                                    # Skip messages without phone numbers
                                    continue
                                
                                msg_result = {
                                    "id": str(msg_id) if msg_id else f"msg_{hash(str(msg_data))}",
                                    "content": str(msg_content) if msg_content else '',
                                    "number": str(phone_number),  # Ensure it's a string
                                    "date": str(msg_date) if msg_date else datetime.now().isoformat(),
                                    "read": bool(is_read),
                                    "direction": direction,
                                    "type": "MULTIMEDIA" if has_media else "MESSAGE",
                                }
                                
                                if msg_data.get('media_url'):
                                    msg_result["media_url"] = msg_data.get('media_url')
                                elif msg_data.get('media'):
                                    msg_result["media_url"] = msg_data.get('media')
                                elif msg_data.get('attachment'):
                                    msg_result["media_url"] = msg_data.get('attachment')
                                
                                result.append(msg_result)
                            except Exception as e:
                                # Log error for debugging but continue processing other messages
                                # Include the message data keys in the error for debugging
                                import traceback
                                # Add error to debug info if available
                                if debug_info and isinstance(debug_info, dict):
                                    if "errors" not in debug_info:
                                        debug_info["errors"] = []
                                    debug_info["errors"].append({
                                        "error": str(e),
                                        "message_keys": list(msg_data.keys()) if isinstance(msg_data, dict) else [],
                                        "traceback": traceback.format_exc()[:500]  # First 500 chars
                                    })
                                # Don't add to result, just continue
                                continue
                    
                    # Include debug info in the response
                    if debug_info:
                        result.append({"debug": debug_info})
                    
                    elif response.status_code == 403:
                        return [{"error": "403 Forbidden: Cookie expired or invalid"}]
                    elif response.status_code == 401:
                        return [{"error": "401 Unauthorized: Invalid credentials"}]
                    else:
                        return [{"error": f"API request failed with status {response.status_code}"}]
                except Exception as e:
                    # If API call fails, return error in result
                    return [{"error": f"Failed to get all messages: {str(e)}"}]
                
            return result
        except Exception as e:
            return [{"error": str(e)}]


def strip_ansi_codes(text: str) -> str:
    """Remove ANSI escape codes from text"""
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    return ansi_escape.sub('', text)

def main():
    """CLI interface for the service"""
    if len(sys.argv) < 2:
        error_msg = json.dumps({"error": "Invalid arguments"})
        print(error_msg)
        sys.exit(1)

    command = sys.argv[1]
    
    try:
        # Read input from stdin
        stdin_data = sys.stdin.read()
        if not stdin_data:
            error_msg = json.dumps({"error": "No input data provided"})
            print(error_msg)
            sys.exit(1)
            
        input_data = json.loads(stdin_data)
        username = input_data.get("username")
        sid_cookie = input_data.get("sid_cookie")
        user_agent = input_data.get("user_agent")  # User agent from browser (required per GitHub issue #39)
        
        if not username or not sid_cookie:
            error_msg = json.dumps({"error": "Missing username or sid_cookie"})
            print(error_msg)
            sys.exit(1)
        
        service = TextNowService(username, sid_cookie, user_agent)
        
        if command == "send_sms":
            number = input_data.get("number")
            message = input_data.get("message")
            if not number or not message:
                error_msg = json.dumps({"error": "Missing number or message"})
                print(error_msg)
                sys.exit(1)
            result = service.send_sms(number, message)
            # Ensure clean JSON output without any extra formatting
            output = json.dumps(result, ensure_ascii=False)
            print(output)
        
        elif command == "send_media":
            number = input_data.get("number")
            file_path = input_data.get("file_path")
            if not number or not file_path:
                error_msg = json.dumps({"error": "Missing number or file_path"})
                print(error_msg)
                sys.exit(1)
            result = service.send_media(number, file_path)
            output = json.dumps(result, ensure_ascii=False)
            print(output)
        
        elif command == "get_messages":
            number = input_data.get("number")
            num_messages = input_data.get("num_messages", 50)
            messages = service.get_messages(number, num_messages)
            output = json.dumps({"messages": messages}, ensure_ascii=False)
            print(output)
        
        else:
            error_msg = json.dumps({"error": f"Unknown command: {command}"})
            print(error_msg)
            sys.exit(1)
    
    except json.JSONDecodeError as e:
        error_msg = json.dumps({"error": f"Invalid JSON input: {str(e)}"})
        print(error_msg)
        sys.exit(1)
    except Exception as e:
        error_msg = json.dumps({"error": str(e)})
        print(error_msg)
        sys.exit(1)


if __name__ == "__main__":
    main()

