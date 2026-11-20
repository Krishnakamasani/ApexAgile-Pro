import base64
import binascii
from pydantic import BaseModel, Field, field_validator


_IMAGE_SIGNATURES = {
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/jpeg": b"\xff\xd8\xff",
    "image/webp": b"RIFF"
}
_MAX_IMAGE_BYTES = 400_000


class ImageAttachment(BaseModel):
    name: str = Field(..., min_length=1, max_length=160)
    data_url: str = Field(..., min_length=32, max_length=550_000)

    @field_validator("data_url")
    @classmethod
    def validate_image_data_url(cls, value: str) -> str:
        header, separator, encoded_data = value.partition(",")
        mime_type = header[5:-7] if header.startswith("data:") and header.endswith(";base64") else ""
        if not separator or mime_type not in _IMAGE_SIGNATURES:
            raise ValueError("Only PNG, JPEG, and WebP image attachments are supported.")

        try:
            image_data = base64.b64decode(encoded_data, validate=True)
        except (binascii.Error, ValueError):
            raise ValueError("The image attachment data is invalid.") from None

        if not image_data or len(image_data) > _MAX_IMAGE_BYTES:
            raise ValueError("Each image attachment must be 400 KB or smaller after compression.")

        signature = _IMAGE_SIGNATURES[mime_type]
        if not image_data.startswith(signature):
            raise ValueError("The uploaded file does not match its image type.")
        if mime_type == "image/webp" and image_data[8:12] != b"WEBP":
            raise ValueError("The uploaded file does not match its image type.")
        return value
