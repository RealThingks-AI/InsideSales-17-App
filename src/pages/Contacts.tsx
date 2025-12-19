import { ContactTable } from "@/components/ContactTable";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Settings, Upload, Trash2, Download, List, BarChart3 } from "lucide-react";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSimpleContactsImportExport } from "@/hooks/useSimpleContactsImportExport";
import { useCRUDAudit } from "@/hooks/useCRUDAudit";
import { ContactAnalyticsDashboard } from "@/components/contacts/ContactAnalyticsDashboard";

const Contacts = () => {
  const { toast } = useToast();
  const { logBulkDelete } = useCRUDAudit();
  const [viewMode, setViewMode] = useState<'table' | 'analytics'>('table');
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const { handleImport, handleExport, isImporting } = useSimpleContactsImportExport(onRefresh);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await handleImport(file);
      event.target.value = '';
    } catch (error: any) {
      event.target.value = '';
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;
    try {
      const { error } = await supabase.from('contacts').delete().in('id', selectedContacts);
      if (error) throw error;
      await logBulkDelete('contacts', selectedContacts.length, selectedContacts);
      toast({
        title: "Success",
        description: `${selectedContacts.length} contacts deleted successfully`
      });
      setSelectedContacts([]);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contacts",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-background">
        <div className="px-6 h-16 flex items-center border-b w-full">
          <div className="flex items-center justify-between w-full">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="gap-1.5 h-8 px-2.5 text-xs"
                >
                  <List className="h-3.5 w-3.5" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'analytics' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('analytics')}
                  className="gap-1.5 h-8 px-2.5 text-xs"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Analytics
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isImporting}>
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowColumnCustomizer(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Columns
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImportClick} disabled={isImporting}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                  {selectedContacts.length > 0 && (
                    <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected ({selectedContacts.length})
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
                Add Contact
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input for CSV import */}
      <Input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" disabled={isImporting} />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-auto p-6">
        {viewMode === 'analytics' ? (
          <ContactAnalyticsDashboard />
        ) : (
          <ContactTable
            showColumnCustomizer={showColumnCustomizer}
            setShowColumnCustomizer={setShowColumnCustomizer}
            showModal={showModal}
            setShowModal={setShowModal}
            selectedContacts={selectedContacts}
            setSelectedContacts={setSelectedContacts}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>
    </div>
  );
};

export default Contacts;
