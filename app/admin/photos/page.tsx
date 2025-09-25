"use client";
import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Trash2, Eye, Plus, FolderPlus, Folder } from 'lucide-react';
import Image from 'next/image';
import { AdminAuth } from '@/lib/admin-auth';

interface Photo {
  id: string;
  filename: string;
  originalName: string;
  album: string;
  uploadedAt: string;
  size: number;
  url: string;
}

interface Album {
  name: string;
  count: number;
  coverPhoto?: string;
}

export default function AdminPhotosPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [newAlbumName, setNewAlbumName] = useState('');
  const [showNewAlbumForm, setShowNewAlbumForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadAlbum, setUploadAlbum] = useState('general');

  useEffect(() => {
    // Check if already authenticated
    if (AdminAuth.isAuthenticated()) {
      const savedToken = AdminAuth.getToken();
      if (savedToken) {
        setToken(savedToken);
        setAuthenticated(true);
      }
    } else if (process.env.NODE_ENV !== "production") {
      const t = (process.env as any).ADMIN_TOKEN as string | undefined;
      if (t && !token) setToken(t);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchPhotos();
      fetchAlbums();
    }
  }, [authenticated]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/admin/photos', {
        headers: AdminAuth.getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/admin/photos/albums', {
        headers: AdminAuth.getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setAlbums(data.albums || []);
      }
    } catch (error) {
      console.error('Failed to fetch albums:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    Array.from(selectedFiles).forEach((file) => {
      formData.append('photos', file);
    });
    formData.append('album', uploadAlbum);

    try {
      const response = await fetch('/api/admin/photos/upload', {
        method: 'POST',
        headers: AdminAuth.getHeaders(),
        body: formData,
      });

      if (response.ok) {
        await fetchPhotos();
        await fetchAlbums();
        setSelectedFiles(null);
        // Reset file input
        const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const createAlbum = async () => {
    if (!newAlbumName.trim()) return;

    try {
      const response = await fetch('/api/admin/photos/albums', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...AdminAuth.getHeaders()
        },
        body: JSON.stringify({ name: newAlbumName.trim() }),
      });

      if (response.ok) {
        await fetchAlbums();
        setNewAlbumName('');
        setShowNewAlbumForm(false);
      }
    } catch (error) {
      console.error('Failed to create album:', error);
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`/api/admin/photos/${photoId}`, {
        method: 'DELETE',
        headers: AdminAuth.getHeaders(),
      });

      if (response.ok) {
        await fetchPhotos();
        await fetchAlbums();
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const filteredPhotos = selectedAlbum === 'all' 
    ? photos 
    : photos.filter(photo => photo.album === selectedAlbum);

  // Authentication check
  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="bg-white rounded-lg border p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please enter your admin token to access photo management.</p>
          
          <div className="space-y-4">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter admin token"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
            <button
              onClick={() => {
                AdminAuth.setToken(token);
                setAuthenticated(true);
              }}
              disabled={!token.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Access Photo Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Photo Management</h1>
            <p className="text-gray-600">Upload and organize photos for your real estate listings</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/admin"
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </a>
            <button
              onClick={() => {
                AdminAuth.logout();
                window.location.href = '/admin';
              }}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Upload Photos
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">Select Photos</label>
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Select multiple photos (JPG, PNG, WEBP). Max 10MB per file.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Album</label>
            <select
              value={uploadAlbum}
              onChange={(e) => setUploadAlbum(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="general">General</option>
              {albums.map((album) => (
                <option key={album.name} value={album.name}>
                  {album.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleUpload}
            disabled={!selectedFiles || uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Photos'}
          </button>
          
          {selectedFiles && (
            <span className="text-sm text-gray-600 flex items-center">
              {selectedFiles.length} file(s) selected
            </span>
          )}
        </div>
      </div>

      {/* Albums Section */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Folder className="w-5 h-5 mr-2" />
            Albums
          </h2>
          <button
            onClick={() => setShowNewAlbumForm(!showNewAlbumForm)}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
          >
            <FolderPlus className="w-4 h-4 mr-1" />
            New Album
          </button>
        </div>

        {showNewAlbumForm && (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="Album name (e.g., '123 Main St Closing')"
              className="flex-1 border border-gray-300 rounded px-3 py-2"
            />
            <button
              onClick={createAlbum}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewAlbumForm(false);
                setNewAlbumName('');
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedAlbum('all')}
            className={`px-3 py-1 rounded text-sm ${
              selectedAlbum === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Photos ({photos.length})
          </button>
          {albums.map((album) => (
            <button
              key={album.name}
              onClick={() => setSelectedAlbum(album.name)}
              className={`px-3 py-1 rounded text-sm ${
                selectedAlbum === album.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {album.name} ({album.count})
            </button>
          ))}
        </div>
      </div>

      {/* Photos Grid */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <ImageIcon className="w-5 h-5 mr-2" />
          {selectedAlbum === 'all' ? 'All Photos' : `Album: ${selectedAlbum}`}
          <span className="ml-2 text-sm text-gray-500">({filteredPhotos.length})</span>
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading photos...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No photos found</p>
            <p className="text-sm text-gray-400">Upload some photos to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredPhotos.map((photo) => (
              <div key={photo.id} className="group relative">
                <div className="aspect-square relative overflow-hidden rounded-lg border">
                  <Image
                    src={photo.url}
                    alt={photo.originalName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                      <button
                        onClick={() => window.open(photo.url, '_blank')}
                        className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100"
                        title="View full size"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePhoto(photo.id)}
                        className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                        title="Delete photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <p className="truncate" title={photo.originalName}>
                    {photo.originalName}
                  </p>
                  <p className="text-gray-400">
                    {new Date(photo.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
