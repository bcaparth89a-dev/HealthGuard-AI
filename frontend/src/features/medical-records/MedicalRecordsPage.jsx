import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Calendar, Search, AlertCircle, FileDigit, HelpCircle } from 'lucide-react';
import healthService from '../../services/healthService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export const MedicalRecordsPage = () => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch list of documents
  const { data: records, isLoading, isError, error } = useQuery({
    queryKey: ['medicalRecords'],
    queryFn: healthService.getRecords,
  });

  // Mutation to upload records
  const uploadMutation = useMutation({
    mutationFn: healthService.uploadRecord,
    onSuccess: () => {
      // Invalidate and refetch records list
      queryClient.invalidateQueries({ queryKey: ['medicalRecords'] });
      setSelectedFile(null);
    },
  });

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = (event) => {
    event.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('document', selectedFile);
    uploadMutation.mutate(formData);
  };

  // Filter records based on search input
  const filteredRecords = records?.filter(record => 
    record.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Medical Document Digitizer</h1>
        <p className="text-sm text-slate-500">Upload clinical records or laboratory tests for dynamic semantic indexing and OCR summaries.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upload Container */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Record Upload Portal</CardTitle>
            <p className="text-xs text-slate-400">PDF, PNG, or JPG health records accepted.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl p-6 transition-colors bg-slate-50/50 hover:bg-white text-center cursor-pointer relative group">
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="p-3 bg-white shadow-sm border border-slate-100 text-slate-400 group-hover:text-brand-500 rounded-xl mb-3 transition-colors">
                  <Upload size={20} />
                </div>
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700">Choose file or drag & drop</p>
                    <p className="text-xs text-slate-400">Supported up to 10MB</p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={!selectedFile}
                loading={uploadMutation.isPending}
              >
                <FileDigit size={16} />
                Extract Notes
              </Button>

              {uploadMutation.isError && (
                <div className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-medium">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{uploadMutation.error?.message || 'Error occurred during parsing.'}</span>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Records Listing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search extracted documents by name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 bg-white/50 focus:bg-white transition-all outline-none text-sm shadow-sm"
            />
          </div>

          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-premium">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-md font-bold text-slate-800">Failed to load medical records</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                {error?.message || 'Could not fetch processed health records.'}
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredRecords.length === 0 && (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-premium">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
                <FileText size={24} />
              </div>
              <h3 className="text-md font-bold text-slate-800">No medical files found</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                {searchQuery ? 'Adjust your filter keys.' : 'Upload clinical files to extract information.'}
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredRecords.length > 0 && (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <Card key={record.id} className="hover:border-slate-200 transition-colors">
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{record.fileName}</h4>
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                          <Calendar size={10} />
                          {record.createdAt}
                        </span>
                      </div>
                      
                      {/* Clinical extraction */}
                      <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                        <span className="font-bold text-slate-700 block mb-1">OCR Analysis Extraction:</span>
                        <p className="leading-relaxed truncate-2-lines">{record.summary}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordsPage;
