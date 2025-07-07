import React, { useRef } from "react";

const ImageUploader = ({ onImageUpload }) => {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    onImageUpload(img);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col items-center p-8 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600">
            <h3 className="text-2xl font-semibold mb-4 text-gray-200">
                Bước 1: Tải ảnh của bạn
            </h3>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*"
            />
            <button
                onClick={() => fileInputRef.current.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105"
            >
                Chọn ảnh từ máy tính
            </button>
        </div>
    );
};

export default ImageUploader;