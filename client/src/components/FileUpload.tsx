import { useState, useCallback } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File | File[]) => void;
  accept?: string;
  maxSize?: number; // em MB
  label?: string;
  description?: string;
  multiple?: boolean;
}

export function FileUpload({ 
  onFileSelect, 
  accept = '.csv',
  maxSize = 10,
  label = 'Upload de Arquivo CSV',
  description = 'Arraste e solte ou clique para selecionar',
  multiple = false
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    // Valida extensão
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Apenas arquivos CSV são permitidos');
      return false;
    }

    // Valida tamanho
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      setError(`Arquivo muito grande. Máximo: ${maxSize}MB`);
      return false;
    }

    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      if (!multiple) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect, maxSize, multiple]);

  const handleFiles = useCallback((files: File[]) => {
    setError(null);
    const validFiles = files.filter(validateFile);
    if (validFiles.length > 0) {
      if (multiple) {
        setSelectedFiles(validFiles);
        onFileSelect(validFiles);
      }
    }
  }, [onFileSelect, maxSize, multiple]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (multiple) {
        handleFiles(files);
      } else {
        handleFile(files[0]);
      }
    }
  }, [handleFile, handleFiles, multiple]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (multiple) {
        handleFiles(Array.from(files));
      } else {
        handleFile(files[0]);
      }
    }
  }, [handleFile, handleFiles, multiple]);

  const clearFile = () => {
    setSelectedFile(null);
    setSelectedFiles([]);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      <Card
        className={cn(
          "relative border-2 border-dashed transition-colors cursor-pointer",
          isDragging && "border-primary bg-primary/5",
          error && "border-destructive",
          selectedFile && !error && "border-green-500 bg-green-50 dark:bg-green-950/20"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="p-8 text-center">
          {!selectedFile && selectedFiles.length === 0 && !error && (
            <>
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">{description}</p>
              <p className="text-xs text-muted-foreground">
                {multiple ? 'Múltiplos arquivos CSV' : 'Arquivo CSV'} até {maxSize}MB cada
              </p>
            </>
          )}

          {selectedFile && !error && (
            <div className="flex items-center justify-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {selectedFiles.length > 0 && !error && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 mb-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium">{selectedFiles.length} arquivo(s) selecionado(s)</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs bg-background/50 p-2 rounded">
                    <FileText className="h-3 w-3" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="mt-2"
              >
                Limpar
              </Button>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <div className="text-left">
                <p className="text-sm font-medium">Erro ao carregar arquivo</p>
                <p className="text-xs">{error}</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
