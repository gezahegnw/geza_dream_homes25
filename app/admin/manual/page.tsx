"use client";
import { useState } from 'react';
import { Download, FileText, Book } from 'lucide-react';

export default function AdminManualPage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPDF = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/manual/download');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Geza-Dream-Homes-Admin-Manual.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadMarkdown = async () => {
    try {
      const response = await fetch('/api/admin/manual/markdown');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ADMIN_MANUAL.md';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Manual</h1>
        <p className="text-lg text-gray-600">
          Download the complete administration guide for your Geza Dream Homes website.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* PDF Download */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <FileText className="w-8 h-8 text-red-500 mr-3" />
            <h2 className="text-xl font-semibold">PDF Manual</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Download a professionally formatted PDF version of the admin manual. Perfect for printing or offline reference.
          </p>
          <button
            onClick={downloadPDF}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>

        {/* Markdown Download */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Book className="w-8 h-8 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold">Markdown Manual</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Download the raw markdown file. Great for editing, version control, or converting to other formats.
          </p>
          <button
            onClick={downloadMarkdown}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Markdown
          </button>
        </div>
      </div>

      {/* Manual Preview */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Manual Contents</h2>
        <div className="rounded-lg border bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Admin Dashboard Access</li>
                <li>• Authentication Setup</li>
                <li>• Initial Configuration</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">User Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Approving New Users</li>
                <li>• Managing User Access</li>
                <li>• User Activity Monitoring</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Review Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Review Approval Process</li>
                <li>• Content Moderation</li>
                <li>• Spam Prevention</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Lead Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Contact Form Submissions</li>
                <li>• Lead Follow-up</li>
                <li>• Export Options</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Content Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Photo Management</li>
                <li>• Property Updates</li>
                <li>• Profile Management</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Technical</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Environment Configuration</li>
                <li>• Database Management</li>
                <li>• Troubleshooting Guide</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
