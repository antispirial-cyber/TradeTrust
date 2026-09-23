import React, { useState, useRef } from 'react';
import './BlankDropbox.css';

export function BlankDropbox({ onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      if (onFileSelect) onFileSelect(file);
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      if (onFileSelect) onFileSelect(file);
    }
  };

  return (
    <div
      className={`blank-dropbox ${isDragging ? 'is-dragging' : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        className="blank-dropbox-input"
        onChange={handleChange}
      />
      {fileName && <span className="blank-dropbox-preview">{fileName}</span>}
    </div>
  );
}
