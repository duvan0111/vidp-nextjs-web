'use client'

import { useState, useRef, DragEvent, useEffect } from 'react'

// Constantes d'API
const API_URL = 'http://localhost:8000/api/v1/videos/upload'
const API_LIST_URL = 'http://localhost:8000/api/v1/videos/'

// Types d'upload
type UploadState = 'IDLE' | 'SELECTED' | 'UPLOADING' | 'SUCCESS' | 'ERROR'
type VideoStatus = 'uploaded' | 'processing' | 'COMPLETED' | 'FAILED'

interface ApiResponse {
  video_id?: string
  message?: string
  detail?: string
}

interface VideoMetadata {
  video_id: string
  original_filename: string
  file_path: string
  file_size: number
  content_type: string
  status: VideoStatus
  upload_time: string
  processing_time?: string
  completion_time?: string
}

// Composant VideoUploader
function VideoUploader({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [uploadState, setUploadState] = useState<UploadState>('IDLE')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Formats vidéo acceptés
  const acceptedFormats = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo']
  const maxFileSize = 500 * 1024 * 1024 // 500 MB

  // Validation du fichier
  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return 'Format de fichier non supporté. Veuillez sélectionner un fichier MP4, AVI ou MOV.'
    }
    if (file.size > maxFileSize) {
      return 'La taille du fichier dépasse 500 MB. Veuillez sélectionner un fichier plus petit.'
    }
    return null
  }

  // Gestionnaire de sélection de fichier
  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setErrorMessage(validationError)
      setUploadState('ERROR')
      return
    }

    setSelectedFile(file)
    setUploadState('SELECTED')
    setErrorMessage('')
    setApiResponse(null)
  }

  // Gestionnaire d'événement input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Gestionnaire drag & drop
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // Gestionnaire d'upload
  const handleUpload = async () => {
    if (!selectedFile) return

    setUploadState('UPLOADING')
    setUploadProgress(0)
    setErrorMessage('')

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const xhr = new XMLHttpRequest()

      // Gestionnaire de progression
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          setUploadProgress(percentComplete)
        }
      }

      // Gestionnaire de réponse
      xhr.onload = () => {
        try {
          const response: ApiResponse = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300) {
            setApiResponse(response)
            setUploadState('SUCCESS')
            onUploadSuccess()
          } else {
            setErrorMessage(response.detail || response.message || 'Erreur lors du traitement')
            setUploadState('ERROR')
          }
        } catch {
          setErrorMessage('Erreur lors du parsing de la réponse')
          setUploadState('ERROR')
        }
      }

      // Gestionnaire d'erreur
      xhr.onerror = () => {
        setErrorMessage('Erreur réseau lors de l&apos;upload')
        setUploadState('ERROR')
      }

      // Envoi de la requête
      xhr.open('POST', API_URL)
      xhr.send(formData)

    } catch (error) {
      setErrorMessage('Erreur lors de l&apos;upload: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
      setUploadState('ERROR')
    }
  }

  // Gestionnaire de reset
  const handleReset = () => {
    setSelectedFile(null)
    setUploadState('IDLE')
    setUploadProgress(0)
    setApiResponse(null)
    setErrorMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Formatage de la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Zone de drop */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${uploadState === 'UPLOADING' 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800/50'
          }
        `}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => uploadState !== 'UPLOADING' && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploadState === 'UPLOADING'}
        />
        
        {uploadState === 'IDLE' && (
          <div className="space-y-4">
            <div className="text-6xl">📹</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Glissez-déposez votre vidéo ici
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                ou cliquez pour sélectionner un fichier
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Formats supportés: MP4, AVI, MOV (max. 500 MB)
              </p>
            </div>
          </div>
        )}

        {uploadState === 'SELECTED' && selectedFile && (
          <div className="space-y-4">
            <div className="text-6xl">🎬</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Fichier sélectionné
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-medium mt-2">
                {selectedFile.name}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
        )}

        {uploadState === 'UPLOADING' && (
          <div className="space-y-4">
            <div className="text-6xl animate-pulse">⏳</div>
            <div>
              <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                Upload en cours...
              </h3>
              <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {Math.round(uploadProgress)}% complété
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bouton d'upload */}
      {uploadState === 'SELECTED' && (
        <button
          onClick={handleUpload}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          Démarrer le Traitement
        </button>
      )}

      {/* Message de succès */}
      {uploadState === 'SUCCESS' && apiResponse && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">✅</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Upload réussi !
              </h3>
              {apiResponse.video_id && (
                <p className="text-green-700 dark:text-green-300 mt-1">
                  <span className="font-medium">ID Vidéo:</span> {apiResponse.video_id}
                </p>
              )}
              {apiResponse.message && (
                <p className="text-green-700 dark:text-green-300 mt-1">
                  {apiResponse.message}
                </p>
              )}
              <button
                onClick={handleReset}
                className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Uploader une autre vidéo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {uploadState === 'ERROR' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">❌</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Erreur
              </h3>
              <p className="text-red-700 dark:text-red-300 mt-1">
                {errorMessage}
              </p>
              <button
                onClick={handleReset}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant VideoList - Affiche les vidéos uploadées
function VideoList({ videos, onRefresh }: { videos: VideoMetadata[], onRefresh: () => void }) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('fr-FR')
  }

  const getStatusBadge = (status: VideoStatus) => {
    const badges = {
      UPLOADED: { color: 'bg-blue-500', icon: '📤', label: 'Uploadée' },
      PROCESSING: { color: 'bg-yellow-500', icon: '⚙️', label: 'En traitement' },
      COMPLETED: { color: 'bg-green-500', icon: '✅', label: 'Terminée' },
      FAILED: { color: 'bg-red-500', icon: '❌', label: 'Échouée' }
    }
    const badge = badges[status] || badges.UPLOADED
    
    return (
      <span className={`${badge.color} text-white px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1`}>
        <span>{badge.icon}</span>
        <span>{badge.label}</span>
      </span>
    )
  }

  const uploadedVideos = videos.filter(v => v.status === "uploaded" || v.status === 'COMPLETED')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🎥</span>
          <span>Mes Vidéos ({uploadedVideos.length})</span>
        </h2>
        <button
          onClick={onRefresh}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <span>🔄</span>
          <span>Actualiser</span>
        </button>
      </div>

      {uploadedVideos.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-gray-400">Aucune vidéo uploadée pour le moment</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {uploadedVideos.map((video) => (
            <div
              key={video.video_id}
              className={`bg-gray-800/70 border rounded-lg p-4 transition-all duration-200 cursor-pointer hover:bg-gray-800 ${
                selectedVideo === video.video_id ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-700'
              }`}
              onClick={() => setSelectedVideo(selectedVideo === video.video_id ? null : video.video_id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {video.original_filename}
                    </h3>
                    {getStatusBadge(video.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>📊</span>
                      <span>{formatFileSize(video.file_size)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🕒</span>
                      <span>{formatDate(video.upload_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🆔</span>
                      <span className="truncate">{video.video_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📝</span>
                      <span>{video.content_type}</span>
                    </div>
                  </div>
                </div>
                <div className="text-2xl ml-4">
                  {selectedVideo === video.video_id ? '🔼' : '🔽'}
                </div>
              </div>

              {selectedVideo === video.video_id && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <video
                    controls
                    className="w-full rounded-lg bg-black"
                    src={`http://localhost:8000/api/v1/videos/stream/${video.video_id}`}
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Composant ProcessingVideos - Affiche les vidéos en traitement
function ProcessingVideos({ videos, onRefresh }: { videos: VideoMetadata[], onRefresh: () => void }) {
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('fr-FR')
  }

  const processingVideos = videos.filter(v => v.status === 'processing')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>⚙️</span>
          <span>Traitement en cours ({processingVideos.length})</span>
        </h2>
        <button
          onClick={onRefresh}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <span>🔄</span>
          <span>Actualiser</span>
        </button>
      </div>

      {processingVideos.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">✨</div>
          <p className="text-gray-400">Aucune vidéo en cours de traitement</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {processingVideos.map((video) => (
            <div
              key={video.video_id}
              className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-600/50 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="animate-spin text-2xl">⚙️</div>
                    <h3 className="text-lg font-semibold text-white truncate">
                      {video.original_filename}
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <span>🆔</span>
                      <span className="truncate">{video.video_id}</span>
                    </div>
                    {video.processing_time && (
                      <div className="flex items-center gap-2">
                        <span>🕒</span>
                        <span>Démarré: {formatDate(video.processing_time)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className="bg-yellow-500 h-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Traitement en cours...</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Composant principal de la page
export default function Home() {
  const [videos, setVideos] = useState<VideoMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchVideos = async () => {
    try {
      const response = await fetch(API_LIST_URL)
      if (response.ok) {
        const data = await response.json()
        setVideos(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des vidéos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
    // Actualiser toutes les 5 secondes
    const interval = setInterval(fetchVideos, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Pipeline hybride de traitement vidéo (VidP)
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Interface de soumission pour le traitement initial de vos vidéos. 
            Téléchargez vos fichiers vidéo pour commencer le processus d&apos;analyse.
          </p>
        </header>

        {/* Contenu principal en grille */}
        <main>

          {/* Centre - Upload */}
          <div className='w-full mb-12'>
            <VideoUploader onUploadSuccess={fetchVideos} />
          </div>

          <div className='grid lg:grid-cols-2 gap-8'>

            {/* Colonne gauche - Traitement */}
            <div className="space-y-8">
              <ProcessingVideos videos={videos} onRefresh={fetchVideos} />
            </div>

            {/* Colonne droite - Liste des vidéos */}
            <div>
              {isLoading ? (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4 animate-pulse">⏳</div>
                  <p className="text-gray-400">Chargement des vidéos...</p>
                </div>
              ) : (
                <VideoList videos={videos} onRefresh={fetchVideos} />
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center mt-16 pt-8 border-t border-gray-700">
          <p className="text-gray-400">
            INF5141 Cloud Computing - Projet VidP &nbsp;|&nbsp; Réalisé par HN-DS-CIN 5 &copy; 2025
          </p>
        </footer>
      </div>
    </div>
  )
}
