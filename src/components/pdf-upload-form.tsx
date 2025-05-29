// components/pdf-upload-form.tsx
'use client'

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const PdfUploadForm = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル選択処理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      console.log('選択されたファイル:', file.name);
    } else {
      alert('PDFファイルを選択してください');
    }
  };

  // ファイル選択ボタンクリック
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // アップロード処理（シンプル版）
const handleUpload = async () => {
    if (!selectedFile) return;
  
    setIsUploading(true);
    setUploadProgress(20);
  
    try {
      console.log('🚀 アップロード開始:', selectedFile.name);
  
      // FormDataを作成
      const formData = new FormData();
      formData.append('file', selectedFile);
  
      setUploadProgress(50);
  
      // fetch APIを使用してPOST
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
  
      setUploadProgress(80);
  
      const result = await response.json();
  
      if (response.ok) {
        console.log('✅ 成功:', result);
        setUploadProgress(100);
        alert(`成功: ${result.message}`);
      } else {
        console.error('❌ エラー:', result);
        alert(`エラー: ${result.error}`);
      }
  
    } catch (error) {
      console.error('💥 送信エラー:', error);
      alert('送信に失敗しました');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  // ファイルサイズを読みやすい形式に変換
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>PDF & ドロップ</CardTitle>
          <CardDescription>
            PDFファイルをアップロードしてください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ファイル選択 */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf"
              className="hidden"
            />
            <Button
              onClick={handleButtonClick}
              variant="outline"
              className="w-full"
              disabled={isUploading}
            >
              📄 ファイルを選択
            </Button>
          </div>

          {/* 選択されたファイル情報 */}
          {selectedFile && (
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">選択されたファイル:</p>
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* アップロード進捗 */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>アップロード中...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* アップロードボタン */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? 'アップロード中...' : 'アップロード'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PdfUploadForm;