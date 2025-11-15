import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload as UploadIcon, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

export default function Upload() {
  const [, setLocation] = useLocation();
  const [b3Files, setB3Files] = useState<File[]>([]);
  const [winfutFile, setWinfutFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');

  const uploadB3Mutation = trpc.b3.uploadB3CSV.useMutation();
  const uploadWinfutMutation = trpc.b3.uploadWINFUTCSV.useMutation();

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  };

  const handleUpload = async () => {
    if (b3Files.length === 0 && !winfutFile) {
      toast.error('Selecione pelo menos um arquivo para fazer upload');
      return;
    }

    setUploadStatus('uploading');
    setUploadMessage('Processando arquivos...');

    try {
      let totalRegistrosB3 = 0;
      let totalRegistrosWinfut = 0;

      // Upload arquivos B3 (todos de uma vez)
      if (b3Files.length > 0) {
        setUploadMessage(`Processando ${b3Files.length} arquivo(s) da B3...`);
        
        const arquivos = await Promise.all(
          b3Files.map(async (file) => ({
            conteudo: await readFileAsText(file),
            nomeArquivo: file.name
          }))
        );
        
        const resultado = await uploadB3Mutation.mutateAsync({ arquivos });
        totalRegistrosB3 = resultado.totalRegistros;
      }

      // Upload arquivo WINFUT
      if (winfutFile) {
        setUploadMessage('Processando arquivo WINFUT...');
        const conteudo = await readFileAsText(winfutFile);
        const resultado = await uploadWinfutMutation.mutateAsync({ conteudo });
        totalRegistrosWinfut = resultado.totalRegistros;
      }

      setUploadStatus('success');
      setUploadMessage(
        `Upload concluído com sucesso! ${totalRegistrosB3} registros B3 e ${totalRegistrosWinfut} registros WINFUT processados.`
      );
      
      toast.success('Arquivos processados com sucesso!');
      
      // Redireciona para o dashboard após 2 segundos
      setTimeout(() => {
        setLocation('/dashboard');
      }, 2000);

    } catch (error) {
      setUploadStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar arquivos';
      setUploadMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleAddB3Files = (files: File | File[]) => {
    const fileArray = Array.isArray(files) ? files : [files];
    setB3Files(prev => [...prev, ...fileArray]);
    toast.success(`${fileArray.length} arquivo(s) adicionado(s)`);
  };

  const handleRemoveB3File = (index: number) => {
    setB3Files(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Dashboard B3 + Proffit</h1>
          </div>
          <p className="text-muted-foreground">
            Faça upload dos arquivos CSV da B3 e WINFUT para análise de fluxo de investidores
          </p>
        </div>

        {/* Upload Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* B3 Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Arquivos B3</CardTitle>
              <CardDescription>
                Upload dos arquivos de Participação dos Investidores da B3
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                onFileSelect={handleAddB3Files}
                label="Adicionar arquivos CSV da B3"
                description="Clique ou arraste múltiplos arquivos CSV"
                multiple
              />
              
              {b3Files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{b3Files.length} arquivo(s) selecionado(s)</p>
                  <div className="space-y-1">
                    {b3Files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                        <span className="truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveB3File(index)}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WINFUT Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Arquivo WINFUT</CardTitle>
              <CardDescription>
                Upload do arquivo de cotações do WINFUT exportado do Proffit (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={(file) => {
                  if (Array.isArray(file)) {
                    setWinfutFile(file[0]);
                  } else {
                    setWinfutFile(file);
                  }
                }}
                label="Arquivo CSV do WINFUT"
                description="Clique ou arraste o arquivo CSV"
              />
            </CardContent>
          </Card>
        </div>

        {/* Status Messages */}
        {uploadStatus !== 'idle' && (
          <Alert variant={uploadStatus === 'error' ? 'destructive' : 'default'}>
            {uploadStatus === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploadStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {uploadStatus === 'error' && <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{uploadMessage}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleUpload}
            disabled={uploadStatus === 'uploading' || (b3Files.length === 0 && !winfutFile)}
          >
            {uploadStatus === 'uploading' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <UploadIcon className="mr-2 h-4 w-4" />
                Processar Arquivos
              </>
            )}
          </Button>

          {uploadStatus === 'success' && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation('/dashboard')}
            >
              Ir para Dashboard
            </Button>
          )}
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. <strong>Arquivos B3:</strong> Faça upload dos arquivos CSV de "Participação dos Investidores" baixados da B3. Você pode adicionar múltiplos arquivos de diferentes datas.</p>
            <p>2. <strong>Arquivo WINFUT:</strong> Faça upload do arquivo CSV de cotações do WINFUT exportado do Proffit Chart (opcional, mas necessário para análise de correlações).</p>
            <p>3. Clique em "Processar Arquivos" para iniciar a análise.</p>
            <p>4. Após o processamento, você será redirecionado para o dashboard com as visualizações interativas.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
