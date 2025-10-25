import requests
import json
import os
from typing import Optional

class IPFSService:
    """Service for interacting with IPFS via Pinata API"""
    
    def __init__(self):
        self.pinata_api_key = os.environ.get('PINATA_API_KEY', '')
        self.pinata_secret_key = os.environ.get('PINATA_SECRET_KEY', '')
        self.pinata_jwt = os.environ.get('PINATA_JWT', '')
        
        # Use Pinata API
        self.upload_url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        self.json_url = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
        
    def upload_file(self, file_path: str, file_name: str) -> Optional[dict]:
        """Upload file to IPFS via Pinata"""
        try:
            if not self.pinata_jwt and not self.pinata_api_key:
                # Fallback: simulate IPFS upload for MVP
                return self._simulate_ipfs_upload(file_name)
            
            headers = {
                'Authorization': f'Bearer {self.pinata_jwt}' if self.pinata_jwt else None,
                'pinata_api_key': self.pinata_api_key,
                'pinata_secret_api_key': self.pinata_secret_key
            }
            
            with open(file_path, 'rb') as file:
                files = {'file': (file_name, file)}
                response = requests.post(self.upload_url, files=files, headers=headers)
                
                if response.status_code == 200:
                    return response.json()
                else:
                    # Fallback to simulation
                    return self._simulate_ipfs_upload(file_name)
                    
        except Exception as e:
            print(f"IPFS upload error: {e}")
            return self._simulate_ipfs_upload(file_name)
    
    def upload_json(self, data: dict) -> Optional[dict]:
        """Upload JSON metadata to IPFS"""
        try:
            if not self.pinata_jwt and not self.pinata_api_key:
                return self._simulate_ipfs_json(data)
            
            headers = {
                'Authorization': f'Bearer {self.pinata_jwt}' if self.pinata_jwt else None,
                'pinata_api_key': self.pinata_api_key,
                'pinata_secret_api_key': self.pinata_secret_key,
                'Content-Type': 'application/json'
            }
            
            response = requests.post(self.json_url, json=data, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                return self._simulate_ipfs_json(data)
                
        except Exception as e:
            print(f"IPFS JSON upload error: {e}")
            return self._simulate_ipfs_json(data)
    
    def _simulate_ipfs_upload(self, file_name: str) -> dict:
        """Simulate IPFS upload for MVP/testing"""
        import hashlib
        import time
        
        # Generate simulated IPFS hash
        content = f"{file_name}{time.time()}"
        ipfs_hash = 'Qm' + hashlib.sha256(content.encode()).hexdigest()[:44]
        
        return {
            'IpfsHash': ipfs_hash,
            'PinSize': 0,
            'Timestamp': time.time(),
            'simulated': True
        }
    
    def _simulate_ipfs_json(self, data: dict) -> dict:
        """Simulate IPFS JSON upload"""
        import hashlib
        import time
        
        content = json.dumps(data) + str(time.time())
        ipfs_hash = 'Qm' + hashlib.sha256(content.encode()).hexdigest()[:44]
        
        return {
            'IpfsHash': ipfs_hash,
            'PinSize': 0,
            'Timestamp': time.time(),
            'simulated': True
        }
    
    def get_gateway_url(self, ipfs_hash: str) -> str:
        """Get IPFS gateway URL"""
        return f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"

# Initialize IPFS service
ipfs_service = IPFSService()