"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Upload, FileText, Download, Eye } from "lucide-react";

interface UploadResult {
  message: string;
  fileName: string;
  originalName: string;
  size: number;
  path: string;
}

interface PdfPreviewProps {
  file: File;
  previewUrl: string;
  onError: (error: string) => void;
}

// PDFプレビューコンポーネントを分離
const PdfPreview: React.FC<PdfPreviewProps> = ({ file, previewUrl, onError }) => {
  const [previewMethod, setPreviewMethod] = useState<'embed' | 'iframe' | 'object'>('embed');
  const [isLoading, setIsLoading] = useState(true);

  const handlePreviewError = useCallback((method: string) => {
    console.error(`${method} preview failed`);
    onError(`${method}でのプレビューに失敗しました`);
  }, [onError]);

  const handlePreviewLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="space-y-4">
      {/* プレビュー方法選択 */}
      <div className="flex gap-2">
        <Button
          variant={previewMethod === 'embed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreviewMethod('embed')}
        >
          Embed
        </Button>
        <Button
          variant={previewMethod === 'iframe' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreviewMethod('iframe')}
        >
          iFrame
        </Button>
        <Button
          variant={previewMethod === 'object' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreviewMethod('object')}
        >
          Object
        </Button>
      </div>

      {/* プレビュー表示 */}
      <div className="relative w-full h-96 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="text-sm text-gray-600">読み込み中...</div>
          </div>
        )}

        {previewMethod === 'embed' && (
          <embed
            src={previewUrl}
            type="application/pdf"
            className="w-full h-full"
            onLoad={handlePreviewLoad}
            onError={() => handlePreviewError('Embed')}
          />
        )}

        {previewMethod === 'iframe' && (
          <iframe
            src={previewUrl}
            className="w-full h-full"
            title="PDF プレビュー"
            onLoad={handlePreviewLoad}
            onError={() => handlePreviewError('iFrame')}
          />
        )}

        {previewMethod === 'object' && (
          <object
            data={previewUrl}
            type="application/pdf"
            className="w-full h-full"
            onLoad={handlePreviewLoad}
            onError={() => handlePreviewError('Object')}
          >
            <p className="p-4 text-center text-gray-600">
              PDFを表示できません。
              <a 
                href={previewUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1"
              >
                新しいタブで開く
              </a>
            </p>
          </object>
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2">
        <Button
          onClick={() => window.open(previewUrl, '_blank')}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          新しいタブで開く
        </Button>
        <a
          href={previewUrl}
          download={file.name}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-transparent border border-blue-300 rounded-md hover:bg-blue-100"
        >
          <Download className="w-4 h-4" />
          ダウンロード
        </a>
      </div>
    </div>
  );
};

const PdfUploadForm = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイルサイズの制限（10MB）
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // エラーのクリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ファイルバリデーション
  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.includes('pdf')) {
      return 'PDFファイルを選択してください';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `ファイルサイズが大きすぎます。${formatFileSize(MAX_FILE_SIZE)}以下のファイルを選択してください`;
    }
    return null;
  }, []);

  // プレビューURL生成
  const createPreviewUrl = useCallback((file: File) => {
    try {
      const blob = new Blob([file], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Blob URL generation failed:', error);
      return null;
    }
  }, []);

  // ファイル選択処理
  const handleFileSelect = useCallback((file: File) => {
    clearError();
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // 既存のプレビューURLをクリーンアップ
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const newPreviewUrl = createPreviewUrl(file);
    setPreviewUrl(newPreviewUrl);
    setUploadResult(null);
  }, [validateFile, createPreviewUrl, previewUrl, clearError]);

  // ファイル入力変更ハンドラー
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // ドラッグ&ドロップハンドラー
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    const file = files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // ファイル選択ボタンクリック
  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ファイル削除
  const handleFileRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  // アップロード処理（改善版）
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      setUploadProgress(30);

      // AbortControllerでタイムアウト設定
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setUploadProgress(70);

      if (!response.ok) {
        throw new Error(`アップロードに失敗しました: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      setUploadResult({
        message: "アップロード完了",
        fileName: selectedFile.name,
        originalName: selectedFile.name,
        size: selectedFile.size,
        path: blobUrl,
      });
      setUploadProgress(100);

    } catch (error) {
      console.error("Upload error:", error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('アップロードがタイムアウトしました');
        } else {
          setError(`アップロードエラー: ${error.message}`);
        }
      } else {
        setError('不明なエラーが発生しました');
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }, [selectedFile]);

  // ファイルサイズフォーマット
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* アップロードセクション */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              PDF アップロード
            </CardTitle>
            <CardDescription>
              PDFファイルをドラッグ&ドロップまたは選択してアップロード（{formatFileSize(MAX_FILE_SIZE)}以下）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* エラー表示 */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center justify-between">
                  {error}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearError}
                    className="h-auto p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* ドラッグ&ドロップエリア */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : selectedFile 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleButtonClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleInputChange}
                accept=".pdf,application/pdf"
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="w-12 h-12 mx-auto text-green-600" />
                  <p className="font-medium text-green-800">{selectedFile.name}</p>
                  <p className="text-sm text-green-600">{formatFileSize(selectedFile.size)}</p>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileRemove();
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <X className="w-4 h-4 mr-1" />
                    削除
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-gray-600">
                    PDFファイルをドラッグ&ドロップ<br />
                    またはクリックして選択
                  </p>
                </div>
              )}
            </div>

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
              size="lg"
            >
              {isUploading ? "アップロード中..." : "アップロード"}
            </Button>

            {/* アップロード成功表示 */}
            {uploadResult && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium text-green-800">
                      ✅ {uploadResult.message}
                    </p>
                    <p className="text-sm text-green-700">
                      ファイル名: {uploadResult.originalName}
                    </p>
                    <p className="text-xs text-green-600">
                      サイズ: {formatFileSize(uploadResult.size)}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* プレビューセクション */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              プレビュー
            </CardTitle>
            <CardDescription>
              選択されたPDFファイルのプレビュー
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedFile && previewUrl ? (
              <PdfPreview
                file={selectedFile}
                previewUrl={previewUrl}
                onError={setError}
              />
            ) : (
              <div className="w-full h-96 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-2">
                  <FileText className="w-16 h-16 mx-auto text-gray-300" />
                  <p className="text-gray-500">
                    PDFファイルを選択すると<br />
                    プレビューが表示されます
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PdfUploadForm;