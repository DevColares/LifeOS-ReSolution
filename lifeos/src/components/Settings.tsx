import { useState } from "react";
import { Download, Upload, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataExport } from "@/hooks/useDataExport";

export default function Settings() {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const { exportData, importData, clearData } = useDataExport();

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    importData(file)
      .then(() => {
        alert("Data imported successfully!");
        window.location.reload();
      })
      .catch((error) => {
        setImportError(error.message || "Failed to import data");
      })
      .finally(() => {
        setIsImporting(false);
        event.target.value = "";
      });
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all your data? This action cannot be undone.")) {
      clearData();
      alert("All data cleared successfully!");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Configurações</h2>
        <p className="text-muted-foreground text-sm">Gerencie seus dados e preferências.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Gerenciamento de Dados</CardTitle>
            <p className="text-sm text-muted-foreground">Exporte seus dados ou redefina o aplicativo.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={exportData} className="bg-primary hover:bg-primary/90">
                Exportar Dados
              </Button>
              <Button onClick={() => document.getElementById('file-input')?.click()} variant="outline">
                Importar Dados
              </Button>
            </div>
            <div className="flex gap-2">
              <input
                id="file-input"
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button onClick={handleClearData} variant="destructive" className="text-sm">
                Resetar Dados
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Tema</CardTitle>
            <p className="text-sm text-muted-foreground">Alterne entre modo claro e escuro.</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tema:</span>
              <span className="text-sm font-medium">Dark/Light</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clear Data */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h3 className="font-semibold text-destructive">Zona de Perigo</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Limpe todos os seus hábitos, metas e preferências. Esta ação não pode ser desfeita.
        </p>
        <Button 
          onClick={handleClearData} 
          variant="destructive"
          className="bg-destructive hover:bg-destructive/90"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Limpar Todos os Dados
        </Button>
      </div>
    </div>
  );
}