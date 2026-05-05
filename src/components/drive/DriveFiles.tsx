import { EventProject, UserProfile } from "../../types";
import { ExternalLink, FolderOpen, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DriveFilesProps {
  event: EventProject;
  profile: UserProfile;
}

export function DriveFiles({ event, profile }: DriveFilesProps) {
  const hasDrive = !!event.driveUrl;

  const handleOpenDrive = () => {
    if (event.driveUrl) {
      window.open(event.driveUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Documentos da Festa</h2>
          <p className="text-slate-400">Arquivos compartilhados, contratos e materiais de apoio no Google Drive.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {hasDrive ? (
          <Card className="glass-card rounded-[2rem] border-white/10 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <FolderOpen className="text-blue-400 w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white">Google Drive Folder</CardTitle>
                    <CardDescription className="text-slate-500">Pasta oficial do evento</CardDescription>
                  </div>
                </div>
                <Button 
                  onClick={handleOpenDrive}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-6 font-bold flex items-center shadow-lg"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Pasta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-[#0a0518]/40 rounded-2xl p-8 border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                  <FileText className="text-slate-600 w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-white font-bold">Acesse os arquivos externos</h4>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                    Todos os documentos, contratos e arquivos pesados estão organizados na pasta do Google Drive deste evento.
                  </p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-mono text-blue-400/70 truncate max-w-md">
                  {event.driveUrl}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white/5 rounded-[2.5rem] p-12 border border-dashed border-white/10 text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="text-slate-500 w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Nenhum Drive vinculado</h3>
              <p className="text-slate-400 max-w-md mx-auto mt-2">
                O link do Google Drive para este evento ainda não foi configurado pelo administrador.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
