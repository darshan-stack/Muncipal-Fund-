from PIL import Image
import exifread
import io
from typing import Optional, Dict, Any
import json

class DocumentProcessor:
    """Process uploaded documents and extract metadata"""
    
    @staticmethod
    def extract_gps_from_image(file_content: bytes) -> Optional[Dict[str, Any]]:
        """Extract GPS coordinates from image EXIF data"""
        try:
            # Read EXIF data
            tags = exifread.process_file(io.BytesIO(file_content))
            
            gps_data = {}
            
            # Extract GPS coordinates
            if 'GPS GPSLatitude' in tags and 'GPS GPSLongitude' in tags:
                lat = tags['GPS GPSLatitude']
                lat_ref = tags.get('GPS GPSLatitudeRef', 'N')
                lon = tags['GPS GPSLongitude']
                lon_ref = tags.get('GPS GPSLongitudeRef', 'E')
                
                # Convert to decimal degrees
                lat_decimal = DocumentProcessor._convert_to_degrees(lat)
                if lat_ref.values[0] == 'S':
                    lat_decimal = -lat_decimal
                
                lon_decimal = DocumentProcessor._convert_to_degrees(lon)
                if lon_ref.values[0] == 'W':
                    lon_decimal = -lon_decimal
                
                gps_data['latitude'] = lat_decimal
                gps_data['longitude'] = lon_decimal
                gps_data['verified'] = True
                
            # Extract timestamp
            if 'GPS GPSDate' in tags:
                gps_data['date'] = str(tags['GPS GPSDate'])
            if 'EXIF DateTimeOriginal' in tags:
                gps_data['timestamp'] = str(tags['EXIF DateTimeOriginal'])
            
            # Extract camera info for authenticity
            if 'Image Make' in tags:
                gps_data['camera_make'] = str(tags['Image Make'])
            if 'Image Model' in tags:
                gps_data['camera_model'] = str(tags['Image Model'])
            
            return gps_data if gps_data else None
            
        except Exception as e:
            print(f"GPS extraction error: {e}")
            return None
    
    @staticmethod
    def _convert_to_degrees(value):
        """Convert GPS coordinates to decimal degrees"""
        d = float(value.values[0].num) / float(value.values[0].den)
        m = float(value.values[1].num) / float(value.values[1].den)
        s = float(value.values[2].num) / float(value.values[2].den)
        return d + (m / 60.0) + (s / 3600.0)
    
    @staticmethod
    def validate_image(file_content: bytes) -> bool:
        """Validate if file is a valid image"""
        try:
            Image.open(io.BytesIO(file_content))
            return True
        except:
            return False
    
    @staticmethod
    def get_file_hash(file_content: bytes) -> str:
        """Get SHA256 hash of file for integrity verification"""
        import hashlib
        return hashlib.sha256(file_content).hexdigest()
    
    @staticmethod
    def extract_pdf_metadata(file_content: bytes) -> Optional[Dict[str, Any]]:
        """Extract metadata from PDF"""
        # For MVP, return basic info
        # In production, use PyPDF2 or similar
        import hashlib
        return {
            'file_hash': hashlib.sha256(file_content).hexdigest(),
            'file_size': len(file_content),
            'file_type': 'pdf'
        }

document_processor = DocumentProcessor()