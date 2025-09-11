"use client";
import { useState, useEffect } from 'react';
import { Image as ImageIcon, Eye, Calendar, Folder } from 'lucide-react';
import Image from 'next/image';

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

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    fetchPhotos();
    fetchAlbums();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/admin/photos');
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/admin/photos/albums');
      if (response.ok) {
        const data = await response.json();
        const albumsWithPropertyPhotos = [
          { name: 'Property Photos', count: 0, coverPhoto: undefined },
          ...(data.albums || [])
        ];
        setAlbums(albumsWithPropertyPhotos);
      }
    } catch (error) {
      console.error('Failed to fetch albums:', error);
    }
  };

  const filteredPhotos = selectedAlbum === 'all' 
    ? photos 
    : photos.filter(photo => photo.album === selectedAlbum);

  const openLightbox = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Photo Gallery</h1>
        <p className="text-gray-600">Browse our collection of property photos and recent closings</p>
      </div>

      {/* Albums Filter */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Folder className="w-5 h-5 mr-2" />
          Albums
        </h2>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedAlbum('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <ImageIcon className="w-5 h-5 mr-2" />
          {selectedAlbum === 'all' ? 'All Photos' : selectedAlbum}
          <span className="ml-2 text-sm text-gray-500">({filteredPhotos.length})</span>
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading photos...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No photos found</h3>
            <p className="text-gray-500">Check back soon for new photos!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => (
              <div key={photo.id} className="group cursor-pointer" onClick={() => openLightbox(photo)}>
                <div className="aspect-square relative overflow-hidden rounded-lg border shadow-sm">
                  <Image
                    src={photo.url}
                    alt={photo.originalName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-900 truncate" title={photo.originalName}>
                    {photo.originalName}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(photo.uploadedAt).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">{photo.album}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeLightbox}
              className="absolute -top-10 right-0 text-white text-xl hover:text-gray-300"
            >
              ✕ Close
            </button>
            <div className="relative">
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.originalName}
                width={800}
                height={600}
                className="max-w-full max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4">
                <h3 className="font-semibold">{selectedPhoto.originalName}</h3>
                <p className="text-sm text-gray-300">
                  {selectedPhoto.album} • {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
