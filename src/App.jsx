import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import adelaProfileImage from './img/artist/adéla/icons/adela_profile.jpg';
import arianaGrandeProfileImage from './img/artist/ariana grande/icon/ariana grande icon.jpg';
import slayyyterProfileImage from './img/artist/slayyyter/slayyyter-profile.jpg';
import slayyyterAlbumCover from './img/artist/slayyyter/worstmaninamerica_cover.jpg';
import imagePlaceholder from './img/musicfy-image-placeholder.svg';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

const PlayerContext = createContext(null);

const getYoutubeVideoId = (value) => {
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    let videoId = '';

    if (host === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] || '';
    } else if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      videoId = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || '';
    }

    return /^[\w-]{11}$/.test(videoId) ? videoId : '';
  } catch {
    return '';
  }
};

const MUSIC_GENRES = ['Pop', 'K-pop', 'R&B', 'Hip-Hop', 'Rap', 'Rock', 'Indie', 'Alternative', 'Electronic', 'Funk', 'MPB', 'Jazz', 'Classical', 'Country'];

const normalizeGenre = (genre) => String(genre || '')
  .trim()
  .toLocaleLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const splitGenreNames = (value) => String(value || '')
  .split(/[,/|]/)
  .map((genre) => genre.trim())
  .filter(Boolean);

const mergeGenreOptions = (genres = []) => {
  const options = new Map();
  [...MUSIC_GENRES, ...genres.map((genre) => typeof genre === 'string' ? genre : genre?.name || '')]
    .map((genre) => genre.trim())
    .filter(Boolean)
    .forEach((genre) => {
      const key = normalizeGenre(genre);
      if (!options.has(key)) options.set(key, genre);
    });
  return [...options.values()];
};

const getArtistFallbackImage = (artist) => {
  const name = String(artist?.name || '').trim().toLocaleLowerCase();
  if (name === 'adéla') return adelaProfileImage;
  if (name === 'ariana grande') return arianaGrandeProfileImage;
  if (name === 'slayyyter') return slayyyterProfileImage;
  return imagePlaceholder;
};

const getReleaseFallbackImage = (release) => (
  String(release?.title || '').trim().toLocaleLowerCase() === 'wor$t girl in america'
    ? slayyyterAlbumCover
    : imagePlaceholder
);

const accentPalette = [
  // Vermelhos & Rosas
  ['Salmão', '#fda4af'], ['Coral', '#fb7185'], ['Rosa claro', '#f472b6'],
  ['Rosa choque', '#ec4899'], ['Chiclete', '#db2777'], ['Framboesa', '#be123c'],
  ['Vermelho vivo', '#ef4444'], ['Rubi', '#dc2626'], ['Carmesim', '#b91c1c'],
  ['Vinho', '#991b1b'], ['Borgonha', '#881337'], ['Sangria', '#7f1d1d'],

  // Laranjas & Pêssegos
  ['Damasco', '#fed7aa'], ['Pêssego', '#fdba74'], ['Laranja claro', '#fb923c'],
  ['Laranja', '#f97316'], ['Tangerina', '#ea580c'], ['Terracota', '#c2410c'],
  ['Ferrugem', '#9a3412'],

  // Amarelos & Dourados
  ['Creme', '#fef08a'], ['Canário', '#fde047'], ['Amarelo sol', '#facc15'],
  ['Amarelo ouro', '#eab308'], ['Âmbar', '#f59e0b'], ['Mel', '#d97706'],
  ['Mostarda', '#ca8a04'], ['Ocre', '#a16207'],

  // Verdes
  ['Lima néon', '#a3e635'], ['Verde lima', '#84cc16'], ['Oliva claro', '#65a30d'],
  ['Musgo', '#4d7c0f'], ['Oliva escuro', '#3f6212'], ['Menta', '#6ee7b7'],
  ['Verde menta', '#34d399'], ['Verde esmeralda', '#10b981'], ['Verde jade', '#059669'],
  ['Verde trevo', '#16a34a'], ['Floresta', '#166534'], ['Verde pinho', '#14532d'],

  // Cianos & Turquesas
  ['Água-marinha', '#5eead4'], ['Verde água', '#2dd4bf'], ['Turquesa', '#14b8a6'],
  ['Teal', '#0d9488'], ['Aqua', '#22d3ee'], ['Ciano', '#06b6d4'],
  ['Ciano profundo', '#0891b2'], ['Marinho escuro', '#164e63'],

  // Azuis
  ['Azul glacial', '#7dd3fc'], ['Azul celeste', '#38bdf8'], ['Azul oceano', '#0ea5e9'],
  ['Azul cerúleo', '#0284c7'], ['Azul céu', '#60a5fa'], ['Azul elétrico', '#2563eb'],
  ['Azul royal', '#1d4ed8'], ['Cobalto', '#1e40af'], ['Safira', '#1e3b8a'],
  ['Azul noite', '#1e3a8a'], ['Meia-noite', '#172554'],

  // Índigos, Violetas & Roxos
  ['Pervinca', '#a5b4fc'], ['Índigo claro', '#818cf8'], ['Índigo', '#6366f1'],
  ['Índigo profundo', '#4f46e5'], ['Lavanda', '#c4b5fd'], ['Violeta claro', '#a78bfa'],
  ['Violeta', '#8b5cf6'], ['Ametista', '#7c3aed'], ['Lilás', '#c084fc'],
  ['Roxo', '#a855f7'], ['Púrpura', '#9333ea'], ['Uva', '#7e22ce'],
  ['Berinjela', '#581c87'], ['Ameixa', '#4c1d95'], ['Orquídea', '#e879f9'],
  ['Magenta', '#d946ef'], ['Fúcsia', '#c026d3'], ['Fúcsia profundo', '#a21caf'],

  // Terrosos & Neutros
  ['Areia', '#e7e5e4'], ['Linho', '#d6d3d1'], ['Caramelo', '#b45309'],
  ['Bronze', '#92400e'], ['Chocolate', '#78350f'], ['Café', '#451a03'],
  ['Pérola', '#e2e8f0'], ['Prata', '#94a3b8'], ['Grafite', '#64748b'],
  ['Cinza ardósia', '#475569'], ['Chumbo', '#334155'], ['Obsidiana', '#1e293b'],
  ['Carvão', '#0f172a'],
];

const AccentPicker = ({ label, value, onChange }) => (
  <fieldset className="accent-picker">
    <legend>{label}</legend>
    <div className="accent-picker-options">
      {accentPalette.map(([name, color]) => (
        <button
          key={color}
          type="button"
          className={`accent-swatch${value === color ? ' is-selected' : ''}`}
          style={{ '--accent-swatch': color }}
          aria-label={name}
          title={name}
          aria-pressed={value === color}
          onClick={() => onChange(color)}
        />
      ))}
      {value && (
        <button type="button" className="accent-clear" onClick={() => onChange('')} title="Remover cor">
          Sem cor
        </button>
      )}
    </div>
  </fieldset>
);

const formatFeedDate = (value) => {
  if (!value) return '';
  const dateValue = String(value);
  const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? `${dateValue}T12:00:00`
    : dateValue.replace(' ', 'T');
  const parsedDate = new Date(normalizedDate);
  return Number.isNaN(parsedDate.getTime())
    ? String(value)
    : parsedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
};

const handleImageError = (event, fallbackImage) => {
  const image = event.currentTarget;
  const fallbackUrl = new URL(fallbackImage, window.location.href).toString();
  if (image.src === fallbackUrl) {
    image.removeAttribute('src');
    return;
  }
  image.src = fallbackImage;
};

function ArtworkBackdrop({ src, className }) {
  const canvases = useRef([]);
  const isGif = typeof src === 'string' && (/\.gif(?:$|[?#])/i.test(src) || /^data:image\/gif/i.test(src));
  const [activeFrame, setActiveFrame] = useState(-1);
  const [canvasFailed, setCanvasFailed] = useState(false);

  useEffect(() => {
    setActiveFrame(-1);
    setCanvasFailed(false);
    if (!isGif || !src) return undefined;

    let active = true;
    let currentFrame = 0;
    let timer;
    const image = new Image();
    image.crossOrigin = 'anonymous';

    const drawFrame = (frameIndex) => {
      const canvas = canvases.current[frameIndex];
      if (!canvas || !image.naturalWidth || !image.naturalHeight) return false;

      const width = 320;
      const height = 160;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas 2D context is unavailable.');

      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      return true;
    };

    image.onload = () => {
      try {
        if (!drawFrame(currentFrame)) throw new Error('Could not render the animated artwork.');
        setActiveFrame(currentFrame);
        timer = window.setInterval(() => {
          try {
            const nextFrame = 1 - currentFrame;
            if (drawFrame(nextFrame)) {
              currentFrame = nextFrame;
              setActiveFrame(nextFrame);
            }
          } catch (error) {
            if (active) {
              window.clearInterval(timer);
              setCanvasFailed(true);
              console.warn('Could not create a slow animated artwork backdrop.', error);
            }
          }
        }, 3500);
      } catch (error) {
        if (active) {
          setCanvasFailed(true);
          console.warn('Could not create a slow animated artwork backdrop.', error);
        }
      }
    };
    image.onerror = () => {
      if (active) {
        setCanvasFailed(true);
        console.warn('Could not load the animated artwork for its backdrop.');
      }
    };
    image.src = src;

    return () => {
      active = false;
      window.clearInterval(timer);
      image.onload = null;
      image.onerror = null;
    };
  }, [src, isGif]);

  return (
    <div className={`artwork-backdrop ${className || ''}`} aria-hidden="true">
      {(!isGif || canvasFailed || activeFrame < 0) && (
        <img className="artwork-backdrop-image" src={src} alt="" />
      )}
      {isGif && !canvasFailed && [0, 1].map((frameIndex) => (
        <canvas
          key={frameIndex}
          ref={(canvas) => { canvases.current[frameIndex] = canvas; }}
          className={`artwork-backdrop-frame${activeFrame === frameIndex ? ' is-visible' : ''}`}
        />
      ))}
    </div>
  );
}

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/uploads/image', formData);
  const apiOrigin = new URL(api.defaults.baseURL, window.location.origin).origin;
  return new URL(response.data.url, apiOrigin).toString();
};

const AuthContext = createContext();
const ShellAccentContext = createContext(() => {});

function useAuth() {
  return useContext(AuthContext);
}

function isAccountApproved(user) {
  return Boolean(user && Number(user.is_approved) === 1);
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('musicfy-token') || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('musicfy-user');
    return raw ? JSON.parse(raw) : null;
  });

  useLayoutEffect(() => {
    if (token) {
      localStorage.setItem('musicfy-token', token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem('musicfy-token');
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    api.get('/auth/me')
      .then(({ data }) => {
        if (active) setUser(data.user);
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status === 401) {
          setToken('');
          setUser(null);
          return;
        }
        console.error('Unable to refresh the current account:', error);
      });

    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('musicfy-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('musicfy-user');
    }
  }, [user]);

  const login = (tokenValue, userValue) => {
    setToken(tokenValue);
    setUser(userValue);
  };

  const logout = () => {
    setToken('');
    setUser(null);
  };

  const updateUser = useCallback((updates) => {
    setUser((current) => current ? { ...current, ...updates } : current);
  }, []);

  const value = useMemo(() => ({ token, user, login, logout, updateUser }), [token, user, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ProtectedRoute({ admin = false, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('musicfy-theme') === 'light' ? 'light' : 'dark');
  const [playerTrack, setPlayerTrack] = useState(null);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('musicfy-theme', theme);
  }, [theme]);

  return (
    <AuthProvider>
      <PlayerContext.Provider value={setPlayerTrack}>
        <AppContent
          theme={theme}
          onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
        />
        {playerTrack && <YoutubeMiniPlayer track={playerTrack} onClose={() => setPlayerTrack(null)} />}
      </PlayerContext.Provider>
    </AuthProvider>
  );
}

function AppContent({ theme, onToggleTheme }) {
  const { user } = useAuth();
  const [shellAccent, setShellAccent] = useState('');

  return (
    <ShellAccentContext.Provider value={setShellAccent}>
      <div
        className={`app-shell${shellAccent ? ' has-shell-accent' : ''}`}
        style={shellAccent ? { '--shell-accent': shellAccent } : undefined}
      >
        <Navbar theme={theme} onToggleTheme={onToggleTheme} />
        <div className={`app-layout${user?.is_suspended ? ' is-account-suspended' : ''}`}>
          <Sidebar />
          <main className="page-shell">
            {user && !user.is_suspended && !isAccountApproved(user) && (
              <div className="account-approval-notice" role="status">
                <strong>Conta em análise</strong>
                <span>
                  Você pode navegar e ler o conteúdo. As interações serão liberadas após a aprovação da equipe administrativa; atualize a página depois de receber a confirmação.
                </span>
              </div>
            )}
            <AccountAccessGate>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/artists" element={<ArtistsPage />} />
                <Route path="/social" element={<ProtectedRoute><SocialPage /></ProtectedRoute>} />
                <Route path="/community" element={<Navigate to="/social" replace />} />
                <Route path="/artists/:artistId" element={<ArtistDetailPage />} />
                <Route path="/releases/:releaseId" element={<ReleaseDetailPage />} />
                <Route path="/playlists/:playlistId" element={<PlaylistPage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/admin" element={<ProtectedRoute admin><AdminPage /></ProtectedRoute>} />
              </Routes>
            </AccountAccessGate>
          </main>
        </div>
      </div>
    </ShellAccentContext.Provider>
  );
}

function AccountAccessGate({ children }) {
  const { user } = useAuth();
  if (!user?.is_suspended) return children;

  return (
    <section className="suspended-account-page glass-panel">
      <span className="suspended-account-icon" aria-hidden="true">!</span>
      <p className="eyebrow">Acesso limitado</p>
      <h1>Seu perfil está oculto</h1>
      <p>Abra as notificações no topo da página para ver o aviso da equipe. Enquanto isso, o restante da conta ficará indisponível.</p>
    </section>
  );
}

function YoutubeMiniPlayer({ track, onClose }) {
  return (
    <aside className="youtube-mini-player" aria-label="Miniplayer do YouTube">
      <div className="youtube-mini-player-header">
        <div className="youtube-mini-player-info">
          <strong>{track.title}</strong>
          <span>{track.artistName} · {track.releaseTitle}</span>
        </div>
        <button type="button" className="youtube-mini-player-close" onClick={onClose} aria-label="Fechar miniplayer">
          ×
        </button>
      </div>
      <iframe
        key={track.videoId}
        src={`https://www.youtube-nocookie.com/embed/${track.videoId}?autoplay=1&playsinline=1`}
        title={`Vídeo de ${track.title}`}
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </aside>
  );
}

function NavGlyph({ name }) {
  const paths = {
    home: 'M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5z M9 21v-7h6v7',
    explore: 'M10.8 18.6a7.8 7.8 0 1 1 5.5-2.3 M16.5 16.5 21 21',
    artists: 'M9 18V5l12-2v13 M9 18a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Zm12-2a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z',
    settings: 'M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M2 14h4m4-6h4m4 8h4',
    profile: 'M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    social: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7.5a4 4 0 0 1 0 7.5m2 3a4 4 0 0 1 2 3.5v1',
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

function Sidebar() {
  const { user } = useAuth();
  if (user?.is_suspended) return null;

  const items = [
    { to: '/', label: 'Início', icon: 'home', end: true },
    { to: '/explore', label: 'Explorar', icon: 'explore' },
    { to: '/artists', label: 'Artistas', icon: 'artists' },
    ...(user ? [{ to: '/social', label: 'Social', icon: 'social' }] : []),
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Gerenciar', icon: 'settings' }] : []),
    ...(user ? [{ to: `/profile/${user.id}`, label: 'Perfil', icon: 'profile' }] : []),
  ];

  return (
    <aside className="side-dock" aria-label="Navegação principal">
      <nav className="side-dock-links">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `side-dock-link${isActive ? ' is-active' : ''}`}
            title={item.label}
          >
            <NavGlyph name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function Navbar({ theme, onToggleTheme }) {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return undefined;
    }

    let active = true;
    const fetchSearch = async () => {
      try {
        const [artistsRes, releasesRes] = await Promise.all([api.get('/artists'), api.get('/releases')]);
        const matches = [...artistsRes.data, ...releasesRes.data]
          .filter((item) => (item.name || item.title || '').toLowerCase().includes(query.toLowerCase()))
          .slice(0, 6);
        if (active) setResults(matches);
      } catch (error) {
        if (active) setResults([]);
      }
    };

    const timer = setTimeout(fetchSearch, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <header className={`topbar glass-panel${user?.is_suspended ? ' is-account-suspended' : ''}`}>
      <div className="brand-wrap">
        <Link to="/" className="brand">MUSICFY</Link>
      </div>

      {!user?.is_suspended && (
        <div className="search-wrap">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar artistas ou lançamentos" />
          {results.length > 0 && (
            <div className="search-results">
              {results.map((item) => (
                <Link key={item.id + (item.name || item.title)} to={item.name ? `/artists/${item.id}` : `/releases/${item.id}`} onClick={() => setQuery('')}>
                  {item.name || item.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="topbar-account">
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Ativar modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
          aria-pressed={theme === 'light'}
          title={`Ativar modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
        >
          {theme === 'dark' ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />
            </svg>
          )}
        </button>
        {user ? (
          <>
            <NotificationCenter />
            {user.is_suspended ? (
              <span className="account-link">
                <img
                  className="account-avatar"
                  src={user.avatar_url || imagePlaceholder}
                  onError={(event) => handleImageError(event, imagePlaceholder)}
                  alt={user.full_name || user.username || 'Foto do perfil'}
                />
              </span>
            ) : (
              <NavLink
                to={`/profile/${user.id}`}
                className="account-link"
                title="Abrir perfil"
              >
                <img
                  className="account-avatar"
                  src={user.avatar_url || imagePlaceholder}
                  onError={(event) => handleImageError(event, imagePlaceholder)}
                  alt={user.full_name || user.username || 'Foto do perfil'}
                />
              </NavLink>
            )}
            <button className="logout-btn" onClick={logout}>Sair</button>
          </>
        ) : (
          <NavLink to="/auth" className="login-pill">Entrar</NavLink>
        )}
      </div>
    </header>
  );
}

function NotificationCenter() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(Number(response.data.unread_count || 0));
      if (typeof response.data.account_suspended === 'boolean') {
        updateUser({ is_suspended: response.data.account_suspended });
      }
      setError('');
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || 'Não foi possível carregar as notificações.');
    }
  }, [updateUser]);

  useEffect(() => {
    if (!user) return undefined;
    void loadNotifications();
    const timer = window.setInterval(() => { void loadNotifications(); }, 60000);
    return () => window.clearInterval(timer);
  }, [user?.id, loadNotifications]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((current) => current.map((notification) => ({ ...notification, read_status: 1 })));
      setUnreadCount(0);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível marcar as notificações como lidas.');
    }
  };

  const openNotification = async (notification) => {
    if (!notification.read_status) {
      try {
        await api.post(`/notifications/${notification.id}/read`);
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? { ...item, read_status: 1 } : item
        )));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Não foi possível atualizar esta notificação.');
        return;
      }
    }

    setIsOpen(false);
    if (notification.link_url) navigate(notification.link_url);
  };

  const getNotificationIcon = (type) => {
    if (type === 'USER_FOLLOW') return '♙';
    if (type === 'REVIEW_LIKE') return '♥';
    if (type === 'NEW_RELEASE') return '♫';
    if (type === 'REVIEW_REMOVED') return '×';
    if (type === 'ACCOUNT_SUSPENDED') return '!';
    if (type === 'ACCOUNT_RESTORED') return '✓';
    return '•';
  };

  return (
    <div className="notification-center" ref={rootRef}>
      <button
        type="button"
        className="notification-trigger"
        aria-label={unreadCount ? `Notificações, ${unreadCount} não lidas` : 'Notificações'}
        aria-expanded={isOpen}
        aria-controls="notification-popover"
        onClick={() => {
          setIsOpen((open) => !open);
          if (!isOpen) void loadNotifications();
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <section className="notification-popover" id="notification-popover" aria-label="Notificações">
          <header className="notification-popover-header">
            <div>
              <strong>Notificações</strong>
              <small>{unreadCount ? `${unreadCount} não lida${unreadCount === 1 ? '' : 's'}` : 'Tudo em dia'}</small>
            </div>
            {unreadCount > 0 && (
              <button type="button" className="notification-mark-all" onClick={markAllAsRead}>
                Marcar todas como lidas
              </button>
            )}
          </header>
          {error && <p className="notification-error" role="alert">{error}</p>}
          {notifications.length ? (
            <div className="notification-list">
              {notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`notification-item${notification.read_status ? '' : ' is-unread'}`}
                  onClick={() => void openNotification(notification)}
                >
                  <span className={`notification-icon is-${String(notification.type || 'general').toLowerCase()}`} aria-hidden="true">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <span className="notification-copy">
                    <span>{notification.message}</span>
                    <small>{formatFeedDate(notification.created_at)}</small>
                  </span>
                  {!notification.read_status && <span className="notification-unread-dot" aria-label="Não lida" />}
                </button>
              ))}
            </div>
          ) : !error ? (
            <p className="notification-empty">Você ainda não tem notificações.</p>
          ) : null}
        </section>
      )}
    </div>
  );
}

function FeaturedCarousel({ slides, user }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [isPointerOver, setIsPointerOver] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const pointerStartX = useRef(null);
  const shouldPauseAutoplay = isAutoplayPaused || isPointerOver || hasFocus || !isDocumentVisible;

  useEffect(() => {
    setActiveIndex((current) => (slides.length ? current % slides.length : 0));
  }, [slides.length]);

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(document.visibilityState === 'visible');
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (slides.length < 2 || shouldPauseAutoplay) return undefined;
    const timeoutId = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [activeIndex, shouldPauseAutoplay, slides.length]);

  if (!slides.length) return null;

  const normalizedIndex = activeIndex % slides.length;
  const activeSlide = slides[normalizedIndex];
  const moveSlide = (direction) => {
    setActiveIndex((current) => (current + direction + slides.length) % slides.length);
  };
  const handlePointerDown = (event) => {
    if (event.target.closest?.('button, a')) return;
    pointerStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerUp = (event) => {
    if (pointerStartX.current == null) return;
    const swipeDistance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(swipeDistance) >= 45) moveSlide(swipeDistance < 0 ? 1 : -1);
  };

  return (
    <section
      className="home-featured-carousel"
      aria-label="Álbuns em destaque"
      aria-roledescription="carrossel"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { pointerStartX.current = null; }}
      onPointerEnter={() => setIsPointerOver(true)}
      onPointerLeave={() => setIsPointerOver(false)}
      onFocusCapture={(event) => setHasFocus(!event.target.closest('.home-featured-autoplay'))}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHasFocus(false);
        } else {
          setHasFocus(!event.relatedTarget.closest('.home-featured-autoplay'));
        }
      }}
    >
      <article
        className="home-featured-slide"
        key={activeSlide.id}
        style={{ '--release-accent': activeSlide.accent_color || activeSlide.artist_accent_color || '#31b6c5' }}
      >
        <img
          className="home-featured-banner"
          src={activeSlide.banner_url || activeSlide.cover_url || getReleaseFallbackImage(activeSlide)}
          onError={(event) => handleImageError(event, activeSlide.cover_url || getReleaseFallbackImage(activeSlide))}
          alt=""
        />
        <div className="home-featured-shade" />
        <div className="home-featured-copy">
          <p className="eyebrow">
            Em destaque · {[activeSlide.artist_name, ...(activeSlide.featured_artists || []).map((artist) => artist.name)].filter(Boolean).join(' feat. ')}
          </p>
          <h2>{activeSlide.title}</h2>
          <p>{activeSlide.description}</p>
          <Link
            to={user ? `/releases/${activeSlide.release_id}?review=1` : '/auth'}
            className="home-featured-cta"
          >
            Avalie já! <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </article>
      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="home-featured-autoplay"
            aria-label={isAutoplayPaused ? 'Ativar rotação automática' : 'Pausar rotação automática'}
            aria-pressed={isAutoplayPaused}
            onClick={() => setIsAutoplayPaused((paused) => !paused)}
          >
            <span aria-hidden="true">{isAutoplayPaused ? '▶' : 'Ⅱ'}</span>
          </button>
          <button
            type="button"
            className="home-featured-arrow is-previous"
            aria-label="Destaque anterior"
            onClick={() => moveSlide(-1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="home-featured-arrow is-next"
            aria-label="Próximo destaque"
            onClick={() => moveSlide(1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="home-featured-indicators" aria-label="Selecionar destaque">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={index === normalizedIndex ? 'is-active' : ''}
                aria-label={`Mostrar destaque ${index + 1}: ${slide.title}`}
                aria-pressed={index === normalizedIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function HomePage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [followingReviews, setFollowingReviews] = useState([]);
  const [generalReviews, setGeneralReviews] = useState([]);
  const [feedMode, setFeedMode] = useState('following');
  const [featuredSlides, setFeaturedSlides] = useState([]);
  const [recentReleases, setRecentReleases] = useState([]);
  const [feedQuery, setFeedQuery] = useState('');
  const [feedRatingFilter, setFeedRatingFilter] = useState('all');
  const [recentReleaseTypeFilter, setRecentReleaseTypeFilter] = useState('Todos');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');

    api.get('/home-feed')
      .then((response) => {
        if (!active) return;
        setReviews(response.data.reviews || []);
        setFollowingReviews(response.data.following_reviews || []);
        setGeneralReviews(response.data.general_reviews || []);
        setFeaturedSlides(response.data.featured_slides || []);
        setRecentReleases(response.data.recent_releases || []);
      })
      .catch((requestError) => {
        if (active) {
          setReviews([]);
          setFeaturedSlides([]);
          setRecentReleases([]);
          setError(requestError.response?.data?.error || 'Não foi possível carregar seu feed.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [user?.id]);

  const handleReviewLikeChange = (reviewId, liked, likeCount) => {
    setReviews((current) => current.map((review) => (
      review.id === reviewId
        ? { ...review, liked_by_user: liked, like_count: likeCount }
        : review
    )));
    setFollowingReviews((current) => current.map((review) => (
      review.id === reviewId ? { ...review, liked_by_user: liked, like_count: likeCount } : review
    )));
    setGeneralReviews((current) => current.map((review) => (
      review.id === reviewId ? { ...review, liked_by_user: liked, like_count: likeCount } : review
    )));
  };

  const handleReviewUpdated = (updatedReview) => {
    const updateList = (current) => current.map((review) => (
      String(review.id) === String(updatedReview.id) ? updatedReview : review
    ));
    setReviews(updateList);
    setFollowingReviews(updateList);
    setGeneralReviews(updateList);
  };

  const handleReviewDeleted = (reviewId) => {
    setReviews((current) => current.filter((review) => String(review.id) !== String(reviewId)));
    setFollowingReviews((current) => current.filter((review) => String(review.id) !== String(reviewId)));
    setGeneralReviews((current) => current.filter((review) => String(review.id) !== String(reviewId)));
  };

  const normalizedFeedQuery = normalizeGenre(feedQuery);
  const selectedFeedReviews = user
    ? (feedMode === 'following' ? followingReviews : generalReviews)
    : generalReviews;
  const visibleReviews = selectedFeedReviews
    .filter((review) => (
      (!normalizedFeedQuery || normalizeGenre(`${review.full_name} ${review.username} ${review.release_title} ${review.artist_name} ${review.review_text}`).includes(normalizedFeedQuery))
      && (feedRatingFilter === 'all' || Number(review.rating || 0) >= Number(feedRatingFilter))
    ))
    .sort((first, second) => String(second.created_at).localeCompare(String(first.created_at)));
  const visibleRecentReleases = recentReleases.filter((release) => (
    recentReleaseTypeFilter === 'Todos' || release.release_type === recentReleaseTypeFilter
  ));

  return (
    <div className="home-page">
      <section className="home-feed-column">
        <FeaturedCarousel slides={featuredSlides} user={user} />
        <header className="home-feed-heading">
          <div>
            <p className="eyebrow">Música compartilhada</p>
            <h1>Seu feed</h1>
            <p>{user ? 'Resenhas de quem você segue e dos lançamentos que salvou.' : 'Descubra o que as pessoas estão ouvindo.'}</p>
          </div>
          <Link to={user ? '/social' : '/auth'} className="home-network-link">
            {user ? 'Encontrar pessoas' : 'Entrar'}
            <span aria-hidden="true">↗</span>
          </Link>
        </header>

        <Link to="/explore" className="home-review-prompt glass-panel">
          <span className="home-review-prompt-icon" aria-hidden="true">✎</span>
          <span>
            <strong>O que você achou do último álbum que ouviu?</strong>
            <small>Escolha um lançamento e publique sua resenha</small>
          </span>
          <span className="home-review-prompt-arrow" aria-hidden="true">↗</span>
        </Link>

        <section className="home-social-feed" aria-labelledby="home-feed-title">
          <div className="home-feed-section-heading">
            <div>
              <p className="eyebrow">Comunidade musical</p>
              <h2 id="home-feed-title">Resenhas</h2>
            </div>
            {!isLoading && <span>{visibleReviews.length} de {reviews.length} resenhas</span>}
          </div>

          <div className="listing-filters home-feed-filters">
            <input
              type="search"
              value={feedQuery}
              onChange={(event) => setFeedQuery(event.target.value)}
              placeholder="Buscar por pessoa, artista ou lançamento"
              aria-label="Buscar resenhas do feed"
            />
            <select aria-label="Filtrar resenhas por nota" value={feedRatingFilter} onChange={(event) => setFeedRatingFilter(event.target.value)}>
              <option value="all">Todas as notas</option>
              <option value="8">Nota 8 ou mais</option>
              <option value="5">Nota 5 ou mais</option>
            </select>
          </div>

          {user && (
            <div className="home-feed-tabs" role="tablist" aria-label="Tipo de feed">
              <button
                type="button"
                role="tab"
                aria-selected={feedMode === 'following'}
                className={feedMode === 'following' ? 'is-active' : ''}
                onClick={() => setFeedMode('following')}
              >
                Seguindo
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={feedMode === 'general'}
                className={feedMode === 'general' ? 'is-active' : ''}
                onClick={() => setFeedMode('general')}
              >
                Para você
              </button>
            </div>
          )}

          {error && <p className="error-text" role="alert">{error}</p>}
          {isLoading ? (
            <div className="home-feed-loading glass-panel" aria-live="polite">Carregando seu feed…</div>
          ) : visibleReviews.length ? (
            <div className="home-review-list">
              {visibleReviews.map((review) => {
  const accentColor =
    review.accent_color ||
    review.artist_accent_color ||
    getArtistAccentColor({
      name: review.artist_name,
      primary_genre: review.release_genre,
    });

  return (
    <article
      key={review.id}
      className="home-review-card glass-panel"
      style={{ "--review-accent": accentColor, "--release-accent": accentColor }}
    >
      <header className="home-review-author-row">
        <Link to={`/profile/${review.user_id}`} className="home-review-author">
          <img
            src={review.avatar_url || imagePlaceholder}
            onError={(event) => handleImageError(event, imagePlaceholder)}
            alt=""
          />
          <span>
            <strong>{review.full_name || review.username}</strong>
            <small>@{review.username} · {formatFeedDate(review.created_at)}</small>
          </span>
        </Link>
        <RatingBadge value={review.rating} />
      </header>

      <Link
        to={`/releases/${review.release_id}`}
        className="home-review-release"
      >
        <img
          src={review.release_cover || imagePlaceholder}
          onError={(event) => handleImageError(event, imagePlaceholder)}
          alt=""
        />
        <span>
          <small>RESENHA DE</small>
          <strong>{review.release_title}</strong>
          <span>{review.artist_name}</span>
        </span>
        <span className="home-review-release-arrow" aria-hidden="true">↗</span>
      </Link>

      {review.review_text ? (
        <p className="home-review-text">{review.review_text}</p>
      ) : (
        <p className="home-review-text is-empty">Compartilhou uma nota para este lançamento.</p>
      )}
      {review.gif_url && <ReviewGif src={review.gif_url} />}

      <footer className="home-review-actions">
        <ReviewLikeButton
          review={review}
          user={user}
          onChange={(liked, likeCount) => handleReviewLikeChange(review.id, liked, likeCount)}
        />
        <ReviewOwnerActions
          review={review}
          user={user}
          onUpdated={handleReviewUpdated}
          onDeleted={handleReviewDeleted}
        />
        <Link to={`/releases/${review.release_id}`} className="home-review-open-link">
          Abrir lançamento
        </Link>
      </footer>
    </article>
  );
})}
            </div>
          ) : (
            <div className="home-feed-empty glass-panel">
              <span className="home-empty-mark" aria-hidden="true">♫</span>
              <h3>{user ? 'Seu feed está começando' : 'Ainda não há resenhas por aqui'}</h3>
              <p>{user
                ? 'Siga pessoas ou salve lançamentos para ver novas resenhas neste espaço.'
                : 'Entre para acompanhar pessoas e guardar os lançamentos que você curte.'}
              </p>
              <Link to={user ? '/social' : '/auth'} className="secondary-btn">
                {user ? 'Descobrir pessoas' : 'Entrar no Musicfy'}
              </Link>
            </div>
          )}
        </section>
      </section>

      <aside className="home-right-rail" aria-label="Descobertas musicais">
        <section className="home-recent-panel glass-panel">
          <header className="home-recent-heading">
            <div>
              <p className="eyebrow">Descubra música nova</p>
              <h2>Lançamentos recentes</h2>
            </div>
            <span className="home-recent-window">Últimos 2 meses</span>
          </header>

          <select
            className="home-recent-type-filter"
            aria-label="Filtrar lançamentos recentes por tipo"
            value={recentReleaseTypeFilter}
            onChange={(event) => setRecentReleaseTypeFilter(event.target.value)}
          >
            <option>Todos</option>
            <option>Album</option>
            <option>EP</option>
            <option>Single</option>
          </select>

          {visibleRecentReleases.length ? (
            <div className="home-recent-list">
              {visibleRecentReleases.map((release) => (
                <Link
                  key={release.id}
                  to={`/releases/${release.id}`}
                  className="home-recent-release"
                  style={{ '--release-accent': release.accent_color || release.artist_accent_color || '#31b6c5' }}
                >
                  <img src={release.cover_url || getReleaseFallbackImage(release)} onError={(event) => handleImageError(event, getReleaseFallbackImage(release))} alt="" />
                  <span>
                    <small>{release.release_type} · {formatFeedDate(release.release_date)}</small>
                    <strong>{release.title}</strong>
                    <span>{[release.artist_name, ...(release.featured_artists || []).map((artist) => artist.name)].filter(Boolean).join(' feat. ')}</span>
                  </span>
                  <span className="home-recent-arrow" aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          ) : !isLoading && recentReleases.length ? (
            <p className="home-recent-empty">Nenhum lançamento deste tipo.</p>
          ) : !isLoading ? (
            <p className="home-recent-empty">Nenhum lançamento nos últimos dois meses.</p>
          ) : (
            <p className="home-recent-empty">Buscando novidades…</p>
          )}

          <Link to="/explore" className="home-explore-link">Explorar catálogo <span aria-hidden="true">→</span></Link>
        </section>

        <section className="home-social-note glass-panel">
          <span aria-hidden="true">✦</span>
          <p>As resenhas do seu feed vêm das pessoas que você segue e dos álbuns que você salvou.</p>
          {user && <Link to="/social">Monte seu círculo musical <span aria-hidden="true">→</span></Link>}
        </section>
      </aside>
    </div>
  );
}

function ExplorePage() {
  const [data, setData] = useState({ featured: [], recent: [], releases: [], artists: [], reviews: [] });
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [releaseTypeFilter, setReleaseTypeFilter] = useState('Todos');
  const [releaseSort, setReleaseSort] = useState('newest');
  const [genreOptions, setGenreOptions] = useState(MUSIC_GENRES);
  const [canScrollGenres, setCanScrollGenres] = useState(false);
  const genreTrackRef = useRef(null);
  const genreDragRef = useRef({ startX: 0, startScrollLeft: 0, isDragging: false, didDrag: false });

  useEffect(() => {
    api.get('/explore').then((res) => setData(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/genres')
      .then((response) => {
        if (active) setGenreOptions(mergeGenreOptions(response.data));
      })
      .catch(console.error);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const track = genreTrackRef.current;
    if (!track) return undefined;

    const updateScrollState = () => {
      setCanScrollGenres(track.scrollWidth > track.clientWidth + 1);
    };

    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, []);

  const normalizedCatalogQuery = normalizeGenre(catalogQuery);
  const filteredReleases = data.releases
    .filter((release) => {
      const releaseGenres = splitGenreNames(release.genre).map(normalizeGenre);
      return (
        (selectedGenre === 'Todos' || releaseGenres.includes(normalizeGenre(selectedGenre)))
        && (releaseTypeFilter === 'Todos' || release.release_type === releaseTypeFilter)
        && (!normalizedCatalogQuery || normalizeGenre(`${release.title} ${release.artist_name}`).includes(normalizedCatalogQuery))
      );
    })
    .sort((first, second) => {
      if (releaseSort === 'oldest') return String(first.release_date).localeCompare(String(second.release_date));
      if (releaseSort === 'title') return String(first.title).localeCompare(String(second.title));
      if (releaseSort === 'rating') {
        return Number(second.avg_rating || 0) - Number(first.avg_rating || 0)
          || Number(second.review_count || 0) - Number(first.review_count || 0);
      }
      return String(second.release_date).localeCompare(String(first.release_date));
    });

  const scrollGenres = (direction) => {
    const track = genreTrackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(track.clientWidth * 0.75, 220), behavior: 'smooth' });
  };

  const handleGenrePointerDown = (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    genreDragRef.current = {
      startX: event.clientX,
      startScrollLeft: genreTrackRef.current.scrollLeft,
      isDragging: true,
      didDrag: false,
    };
  };

  const handleGenrePointerMove = (event) => {
    const drag = genreDragRef.current;
    if (!drag.isDragging) return;
    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 5) drag.didDrag = true;
    if (drag.didDrag) {
      event.preventDefault();
      genreTrackRef.current.scrollLeft = drag.startScrollLeft - distance;
    }
  };

  const stopGenreDrag = () => {
    genreDragRef.current.isDragging = false;
    if (genreDragRef.current.didDrag) {
      window.setTimeout(() => {
        genreDragRef.current.didDrag = false;
      }, 0);
    }
  };

  return (
    <div className="content-stack explore-page">
      <header className="explore-hero">
        <div className="explore-hero-copy">
          <p className="eyebrow">Descubra o que vem a seguir</p>
          <h1>Explore novos <span>universos</span></h1>
          <p>Encontre lançamentos, artistas e sons que combinam com o seu momento.</p>
        </div>
        <span className="explore-hero-mark" aria-hidden="true">♫</span>
      </header>

      <section className="explore-genre-section" aria-label="Explorar por gênero">
        <div className="explore-section-heading">
          <div>
            <p className="eyebrow">Escolha seu clima</p>
            <h2>Explore por gênero</h2>
          </div>
          {canScrollGenres && (
            <div className="genre-controls">
              <button type="button" aria-label="Ver gêneros anteriores" onClick={() => scrollGenres(-1)}>‹</button>
              <button type="button" aria-label="Ver mais gêneros" onClick={() => scrollGenres(1)}>›</button>
            </div>
          )}
        </div>
        <div className="genre-carousel">
          <div
            ref={genreTrackRef}
            className="genre-track"
            onPointerDown={handleGenrePointerDown}
            onPointerMove={handleGenrePointerMove}
            onPointerUp={stopGenreDrag}
            onPointerCancel={stopGenreDrag}
            onPointerLeave={() => {
              if (!genreDragRef.current.isDragging) return;
              stopGenreDrag();
              genreDragRef.current.didDrag = false;
            }}
            onClickCapture={(event) => {
              if (!genreDragRef.current.didDrag) return;
              event.preventDefault();
              event.stopPropagation();
              genreDragRef.current.didDrag = false;
            }}
            onScroll={() => {
              const track = genreTrackRef.current;
              setCanScrollGenres(track.scrollWidth > track.clientWidth + 1);
            }}
          >
            {['Todos', ...genreOptions].map((genre) => (
              <button
                type="button"
                className={`genre-pill${selectedGenre === genre ? ' is-selected' : ''}`}
                key={genre}
                aria-pressed={selectedGenre === genre}
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="subsection explore-release-section">
        <div className="explore-section-heading">
          <div>
            <p className="eyebrow">Catálogo completo</p>
            <h2>Todos os lançamentos</h2>
          </div>
          <span className="explore-filter-label">{filteredReleases.length} encontrados</span>
        </div>
        <div className="listing-filters explore-catalog-filters">
          <input
            type="search"
            value={catalogQuery}
            onChange={(event) => setCatalogQuery(event.target.value)}
            placeholder="Buscar álbum, EP, single ou artista"
            aria-label="Buscar lançamentos"
          />
          <select aria-label="Filtrar por tipo de lançamento" value={releaseTypeFilter} onChange={(event) => setReleaseTypeFilter(event.target.value)}>
            <option>Todos</option>
            <option>Album</option>
            <option>EP</option>
            <option>Single</option>
          </select>
          <select aria-label="Ordenar lançamentos" value={releaseSort} onChange={(event) => setReleaseSort(event.target.value)}>
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="title">Título (A–Z)</option>
            <option value="rating">Melhor avaliados</option>
          </select>
        </div>
        <div className="card-grid">
          {filteredReleases.map((release) => <ReleaseCard key={release.id} release={release} />)}
        </div>
        {filteredReleases.length === 0 && (
          <p className="explore-empty-state">Nenhum lançamento corresponde aos filtros selecionados.</p>
        )}
      </section>
    </div>
  );
}

function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState('popular');

  useEffect(() => {
    api.get('/artists').then((res) => setArtists(res.data)).catch(console.error);
  }, []);

  const filtered = artists
    .filter((artist) => `${artist.name || ''} ${artist.genre_names || artist.genre || ''}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sortMode === 'name'
      ? (a.name || '').localeCompare(b.name || '')
      : Number(b.release_count || 0) - Number(a.release_count || 0));

  return (
    <div className="content-stack artists-page">
      <header className="artists-page-header">
        <div>
          <p className="eyebrow">Explore o catálogo</p>
          <h1>Artistas</h1>
          <p>Encontre novos sons, explore discografias e siga seus artistas favoritos.</p>
        </div>
        <span className="artists-page-count">{artists.length} artistas</span>
      </header>
      <div className="artists-toolbar">
        <input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar artistas ou gêneros" />
        <select aria-label="Ordenar artistas" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
          <option value="popular">Mais lançamentos</option>
          <option value="name">Nome A-Z</option>
        </select>
      </div>
      {filtered.length ? (
        <div className="artist-grid">
          {filtered.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      ) : (
        <div className="profile-empty-state glass-panel">
          <span aria-hidden="true">⌕</span>
          <h3>Nenhum artista encontrado</h3>
          <p>Tente outro nome ou gênero.</p>
        </div>
      )}
    </div>
  );
}

function FollowButton({ userId, initialFollowing = false, onChange }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(Boolean(initialFollowing));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFollowing(Boolean(initialFollowing));
  }, [userId, initialFollowing]);

  if (Number(user?.id) === Number(userId)) return null;
  if (!user) {
    return <Link to="/auth" className="follow-btn">Entrar para seguir</Link>;
  }
  if (!isAccountApproved(user)) {
    return <button type="button" className="follow-btn" disabled title="Sua conta precisa ser aprovada para seguir pessoas.">Aguardando aprovação</button>;
  }

  const toggleFollow = async () => {
    setIsSaving(true);
    setError('');
    try {
      const response = following
        ? await api.delete(`/users/${userId}/follow`)
        : await api.post(`/users/${userId}/follow`);
      setFollowing(Boolean(response.data.following));
      onChange?.(Boolean(response.data.following));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível atualizar o seguimento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="follow-control">
      <button
        type="button"
        className={`follow-btn${following ? ' is-following' : ''}`}
        aria-pressed={following}
        disabled={isSaving}
        onClick={toggleFollow}
      >
        {isSaving ? 'Salvando...' : following ? 'Seguindo' : 'Seguir'}
      </button>
      {error && <span className="follow-error" role="alert">{error}</span>}
    </div>
  );
}

function ArtistFollowButton({ artistId }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setFollowing(false);
      setFollowerCount(0);
      return undefined;
    }

    let active = true;
    api.get(`/artists/${artistId}/follow`)
      .then((response) => {
        if (!active) return;
        setFollowing(Boolean(response.data.following));
        setFollowerCount(Number(response.data.follower_count || 0));
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.response?.data?.error || 'Não foi possível carregar o seguimento do artista.');
      });

    return () => { active = false; };
  }, [artistId, user?.id]);

  if (!user) return <Link to="/auth" className="follow-btn">Entrar para seguir artista</Link>;
  if (!isAccountApproved(user)) {
    return <button type="button" className="follow-btn" disabled title="Sua conta precisa ser aprovada para seguir artistas.">Aguardando aprovação</button>;
  }

  const toggleFollow = async () => {
    setIsSaving(true);
    setError('');
    try {
      const response = following
        ? await api.delete(`/artists/${artistId}/follow`)
        : await api.post(`/artists/${artistId}/follow`);
      setFollowing(Boolean(response.data.following));
      setFollowerCount(Number(response.data.follower_count || 0));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível atualizar o seguimento do artista.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="artist-follow-control">
      <button
        type="button"
        className={`follow-btn${following ? ' is-following' : ''}`}
        aria-pressed={following}
        disabled={isSaving}
        onClick={toggleFollow}
      >
        {isSaving ? 'Salvando...' : following ? 'Seguindo artista' : 'Seguir artista'}
      </button>
      <span className="artist-follow-count">{followerCount} seguidores</span>
      {error && <span className="follow-error" role="alert">{error}</span>}
    </div>
  );
}

function ReviewLikeButton({ review, user, onChange }) {
  const [liked, setLiked] = useState(Boolean(review.liked_by_user));
  const [likeCount, setLikeCount] = useState(Number(review.like_count || 0));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLiked(Boolean(review.liked_by_user));
    setLikeCount(Number(review.like_count || 0));
  }, [review.id, review.liked_by_user, review.like_count]);

  if (!user) {
    return (
      <Link to="/auth" className="review-like-btn">
        ♡ Curtir · {likeCount}
      </Link>
    );
  }
  if (!isAccountApproved(user)) {
    return <button type="button" className="review-like-btn" disabled title="Sua conta precisa ser aprovada para curtir resenhas.">♡ Curtir · {likeCount}</button>;
  }

  const toggleLike = async () => {
    setIsSaving(true);
    setError('');
    try {
      const response = await api.post(`/reviews/${review.id}/like`);
      const nextLiked = Boolean(response.data.liked);
      const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));
      setLiked(nextLiked);
      setLikeCount(nextCount);
      onChange?.(nextLiked, nextCount);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível curtir esta resenha.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="review-like-control">
      <button
        type="button"
        className={`review-like-btn${liked ? ' is-liked' : ''}`}
        aria-pressed={liked}
        disabled={isSaving}
        onClick={toggleLike}
      >
        {liked ? '♥ Curtido' : '♡ Curtir'} · {likeCount}
      </button>
      {error && <span className="follow-error" role="alert">{error}</span>}
    </div>
  );
}

function ReviewOwnerActions({ review, user, onUpdated, onDeleted }) {
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(Number(review.rating));
  const [reviewText, setReviewText] = useState(review.review_text || '');
  const [gifUrl, setGifUrl] = useState(review.gif_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingGif, setIsUploadingGif] = useState(false);
  const [error, setError] = useState('');
  const isOwner = user && Number(user.id) === Number(review.user_id);

  if (!isOwner || !isAccountApproved(user)) return null;

  const openEditor = () => {
    setRating(Number(review.rating));
    setReviewText(review.review_text || '');
    setGifUrl(review.gif_url || '');
    setError('');
    setIsEditing(true);
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await api.put(`/reviews/${review.id}`, {
        rating: Number(rating),
        review_text: reviewText,
        gif_url: gifUrl,
      });
      onUpdated({
        ...review,
        rating: Number(rating),
        review_text: reviewText,
        gif_url: gifUrl,
      });
      setIsEditing(false);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível salvar as alterações da resenha.');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadGif = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.type !== 'image/gif') {
      setError('Selecione um arquivo GIF válido.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('O GIF deve ter no máximo 10 MB.');
      return;
    }

    setError('');
    setIsUploadingGif(true);
    try {
      setGifUrl(await uploadImage(file));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível enviar o GIF.');
    } finally {
      setIsUploadingGif(false);
    }
  };

  const deleteReview = async () => {
    if (!window.confirm(`Excluir sua resenha de "${review.release_title || 'este lançamento'}"? Esta ação não pode ser desfeita.`)) return;
    setIsDeleting(true);
    setError('');
    try {
      await api.delete(`/reviews/${review.id}`);
      onDeleted(review.id);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível excluir esta resenha.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="review-owner-actions">
        <button type="button" className="secondary-btn compact-btn" onClick={openEditor}>
          Editar resenha
        </button>
        <button type="button" className="danger-btn compact-btn" disabled={isDeleting} onClick={deleteReview}>
          {isDeleting ? 'Excluindo…' : 'Excluir resenha'}
        </button>
        {error && !isEditing && <p className="review-error" role="alert">{error}</p>}
      </div>

      {isEditing && (
        <div
          className="modal-backdrop review-backdrop"
          onClick={() => !isSaving && !isUploadingGif && setIsEditing(false)}
        >
          <section
            className="review-modal glass-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-review-title-${review.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="review-modal-header">
              <div>
                <p className="eyebrow">Sua opinião importa</p>
                <h2 id={`edit-review-title-${review.id}`}>Editar resenha</h2>
              </div>
              <button
                type="button"
                className="close-btn review-close-btn"
                aria-label="Fechar edição"
                disabled={isSaving || isUploadingGif}
                onClick={() => setIsEditing(false)}
              >
                ×
              </button>
            </header>

            <form className="review-form" onSubmit={submitEdit}>
              <section className="review-rating-section">
                <div className="review-rating-heading">
                  <div>
                    <h3>Que nota você daria?</h3>
                    <p>Escolha uma nota de 0 a 10.</p>
                  </div>
                  <div className="review-score" aria-live="polite">
                    <strong>{rating}</strong>
                    <span>/10</span>
                  </div>
                </div>
                <input
                  className="review-rating-slider"
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={rating}
                  aria-label={`Nota: ${rating} de 10`}
                  onChange={(event) => setRating(Number(event.target.value))}
                />
                <div className="review-rating-scale" aria-hidden="true">
                  <span>Não gostei</span>
                  <span>Adorei</span>
                </div>
              </section>

              <label className="review-text-label" htmlFor={`edit-review-text-${review.id}`}>
                <span>Conte o que achou <small>opcional</small></span>
                <textarea
                  id={`edit-review-text-${review.id}`}
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder="O que mais chamou sua atenção neste lançamento?"
                  rows="5"
                  maxLength={300}
                  disabled={isSaving || isUploadingGif}
                />
                <small className="review-character-count" aria-live="polite">{reviewText.length}/300 caracteres</small>
              </label>

              <div className="review-gif-picker">
                <label htmlFor={`edit-review-gif-${review.id}`}>
                  <span aria-hidden="true">▧</span>
                  {isUploadingGif ? 'Enviando GIF…' : gifUrl ? 'Trocar GIF' : 'Adicionar GIF'}
                </label>
                <input
                  id={`edit-review-gif-${review.id}`}
                  type="file"
                  accept="image/gif,.gif"
                  onChange={uploadGif}
                  disabled={isSaving || isUploadingGif}
                />
                {gifUrl && (
                  <div className="review-gif-preview">
                    <ReviewGif src={gifUrl} />
                    <button type="button" className="ghost-btn compact-btn" onClick={() => setGifUrl('')}>
                      Remover GIF
                    </button>
                  </div>
                )}
              </div>

              {error && <p className="review-error" role="alert">{error}</p>}

              <div className="review-modal-actions">
                <button
                  className="secondary-btn"
                  type="button"
                  disabled={isSaving || isUploadingGif}
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </button>
                <button className="primary-btn" type="submit" disabled={isSaving || isUploadingGif}>
                  {isSaving ? 'Salvando…' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

function ReviewGif({ src }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) return null;

  return (
    <figure className="review-gif-frame">
      <img src={src} alt="GIF compartilhado na resenha" loading="lazy" onError={() => setHasError(true)} />
    </figure>
  );
}

function SocialPage() {
  const [query, setQuery] = useState('');
  const [followFilter, setFollowFilter] = useState('all');
  const [userSort, setUserSort] = useState('name');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const search = query.trim();
    if (search.length === 1) {
      setUsers([]);
      setError('Digite pelo menos 2 caracteres para buscar pessoas.');
      setIsLoading(false);
      return undefined;
    }

    setError('');
    setIsLoading(true);
    const timer = setTimeout(() => {
      api.get('/users', { params: search ? { q: search } : {} })
        .then((response) => {
          if (active) setUsers(response.data || []);
        })
        .catch((requestError) => {
          if (active) {
            setUsers([]);
            setError(requestError.response?.data?.error || 'Não foi possível carregar as pessoas.');
          }
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const filteredUsers = users
    .filter((person) => (
      followFilter === 'all'
      || (followFilter === 'following' ? Boolean(person.followed_by_user) : !person.followed_by_user)
    ))
    .sort((first, second) => userSort === 'followers'
      ? Number(second.follower_count || 0) - Number(first.follower_count || 0)
        || String(first.full_name || first.username).localeCompare(String(second.full_name || second.username))
      : String(first.full_name || first.username).localeCompare(String(second.full_name || second.username)));

  return (
    <div className="content-stack social-page">
      <header className="social-hero glass-panel">
        <p className="eyebrow">Música fica melhor junto</p>
        <h1>Social</h1>
        <p>Encontre pessoas, acompanhe suas descobertas e compartilhe o que você ouve.</p>
        <label className="social-search">
          <span className="sr-only">Buscar pessoas por nome ou usuário</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou @usuário"
            maxLength={100}
          />
        </label>
      </header>

      <section className="social-results">
        <div className="profile-section-heading">
          <div>
            <p className="eyebrow">{query.trim() ? 'Resultados da busca' : 'Novas conexões'}</p>
            <h2>{query.trim() ? 'Pessoas' : 'Descubra pessoas'}</h2>
          </div>
          {!isLoading && <span className="social-result-count">{filteredUsers.length} perfis</span>}
        </div>
        <div className="listing-filters">
          <select aria-label="Filtrar pessoas por relacionamento" value={followFilter} onChange={(event) => setFollowFilter(event.target.value)}>
            <option value="all">Todos os perfis</option>
            <option value="following">Pessoas que sigo</option>
            <option value="not-following">Pessoas que ainda não sigo</option>
          </select>
          <select aria-label="Ordenar pessoas" value={userSort} onChange={(event) => setUserSort(event.target.value)}>
            <option value="name">Nome (A–Z)</option>
            <option value="followers">Mais seguidores</option>
          </select>
        </div>
        {error && <p className="error-text" role="alert">{error}</p>}
        {isLoading ? (
          <div className="loading-panel">Carregando pessoas…</div>
        ) : filteredUsers.length ? (
          <div className="social-user-grid">
            {filteredUsers.map((person) => (
              <article key={person.id} className="social-user-card glass-panel">
                <Link to={`/profile/${person.id}`} className="social-user-link">
                  <img src={person.avatar_url || imagePlaceholder} onError={(event) => handleImageError(event, imagePlaceholder)} alt="" />
                  <span className="social-user-copy">
                    <strong>{person.full_name || person.username}</strong>
                    <small>@{person.username}</small>
                  </span>
                </Link>
                <p>{person.bio || 'Ainda não adicionou uma biografia.'}</p>
                <div className="social-user-footer">
                  <span>{Number(person.follower_count || 0)} seguidores</span>
                  <FollowButton
                    userId={person.id}
                    initialFollowing={Boolean(person.followed_by_user)}
                    onChange={(isFollowing) => setUsers((current) => current.map((item) => (
                      String(item.id) === String(person.id)
                        ? {
                          ...item,
                          follower_count: Math.max(0, Number(item.follower_count || 0) + (isFollowing ? 1 : -1)),
                          followed_by_user: isFollowing,
                        }
                        : item
                    )))}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : !error ? (
          <div className="profile-empty-state glass-panel">
            <span aria-hidden="true">⌕</span>
            <h3>Ninguém encontrado por enquanto</h3>
            <p>Tente buscar por outro nome ou usuário.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ArtistDetailPage() {
  const { artistId } = useParams();
  const { user } = useAuth();
  const setShellAccent = useContext(ShellAccentContext);
  const [artistData, setArtistData] = useState(null);
  const artistBannerUrl = artistData?.artist?.banner_url || artistData?.artist?.image_url || '';

  useEffect(() => {
    api.get(`/artists/${artistId}`).then((res) => setArtistData(res.data)).catch(console.error);
  }, [artistId]);

  useEffect(() => {
    setShellAccent(artistData?.artist?.accent_color || '');
    return () => setShellAccent('');
  }, [artistData?.artist?.accent_color, setShellAccent]);

  if (!artistData) return <div className="loading-panel">Carregando artista…</div>;

  const accentStyle = artistData.artist.accent_color
    ? { '--artist-accent': artistData.artist.accent_color }
    : undefined;

  return (
    <div className="content-stack artist-detail-page" style={accentStyle}>
      <div className="artist-hero glass-panel">
        <ArtworkBackdrop src={artistBannerUrl || getArtistFallbackImage(artistData.artist)} className="artist-hero-artwork-glow" />
        <img
          className="artist-hero-media"
          src={artistBannerUrl || getArtistFallbackImage(artistData.artist)}
          onError={(event) => handleImageError(event, getArtistFallbackImage(artistData.artist))}
          alt=""
          aria-hidden="true"
        />
        <div className="artist-header-copy">
          <img src={artistData.artist.image_url || getArtistFallbackImage(artistData.artist)} onError={(event) => handleImageError(event, getArtistFallbackImage(artistData.artist))} alt={artistData.artist.name} />
          <div>
            <p className="eyebrow">Artista</p>
            <h1>{artistData.artist.name}</h1>
            <p className="artist-header-meta">
              {artistData.genres.join(', ') || 'Artista independente'}
              <span aria-hidden="true"> • </span>
              {artistData.releases.length} {artistData.releases.length === 1 ? 'lançamento' : 'lançamentos'}
            </p>
          </div>
        </div>
      </div>

      <div className="artist-toolbar">
        <a className="artist-main-action" href="#artist-discography">
          <span aria-hidden="true">▶</span>
          Ver discografia
        </a>
        <ArtistFollowButton artistId={artistData.artist.id} />
        <nav className="artist-page-tabs" aria-label="Seções do artista">
          <a href="#artist-discography">Lançamentos</a>
          <a href="#artist-about">Sobre</a>
        </nav>
        {user?.role === 'ADMIN' && (
          <Link to={`/admin?editArtist=${artistData.artist.id}`} className="secondary-btn compact-btn edit-release-action">
            Editar perfil
          </Link>
        )}
      </div>

      <section className="artist-discography" id="artist-discography">
        <div className="artist-section-heading">
          <p className="eyebrow">Conheça a discografia</p>
          <h2>Lançamentos populares</h2>
        </div>
        <div className="artist-release-list">
          {artistData.releases.length ? artistData.releases.map((release, index) => (
            <Link
              key={release.id}
              to={`/releases/${release.id}`}
              className="artist-release-row"
              style={{ '--release-accent': release.accent_color || artistData.artist.accent_color || '#31b6c5' }}
            >
              <span className="artist-release-rank">{index + 1}</span>
              <img src={release.cover_url || getReleaseFallbackImage(release)} onError={(event) => handleImageError(event, getReleaseFallbackImage(release))} alt="" />
              <span className="artist-release-copy">
                <strong>{release.title}</strong>
                <small>{release.release_type} <span aria-hidden="true">•</span> {release.release_date}</small>
              </span>
              <span className="artist-release-open">Abrir lançamento <span aria-hidden="true">↗</span></span>
            </Link>
          )) : (
            <p className="artist-empty-state">Este artista ainda não tem lançamentos cadastrados.</p>
          )}
        </div>
      </section>

      <section className="artist-about" id="artist-about">
        <p className="eyebrow">Sobre</p>
        <h2>{artistData.artist.name}</h2>
        <p>{artistData.artist.bio || 'Biografia ainda não cadastrada.'}</p>
      </section>
    </div>
  );
}

function ReleaseCard({ release, showListen = false }) {
  const releaseArtistNames = [
    release.artist_name,
    ...(release.featured_artists || []).map((artist) => artist.name),
  ].filter((name, index, names) => name && names.indexOf(name) === index);

  return (
    <Link
      to={`/releases/${release.id}`}
      className="release-card glass-panel"
      style={{ '--release-accent': release.accent_color || release.artist_accent_color || '#31b6c5' }}
    >
      <img src={release.cover_url || getReleaseFallbackImage(release)} onError={(event) => handleImageError(event, getReleaseFallbackImage(release))} alt={release.title} />
      <div className="release-meta">
        <span>{release.release_type}</span>
        <h3>{release.title}</h3>
        <p>{releaseArtistNames.join(' feat. ') || 'Artista'}</p>
        <small>{release.release_date}</small>
        {showListen && <span className="listen-album-btn"><span aria-hidden="true">▶</span> Ouvir álbum</span>}
      </div>
    </Link>
  );
}

function ArtistCard({ artist }) {
  const releaseCount = Number(artist.release_count || 0);

  return (
    <Link
      to={`/artists/${artist.id}`}
      className="artist-card"
      style={artist.accent_color ? { '--artist-accent': artist.accent_color } : undefined}
    >
      <img src={artist.image_url || getArtistFallbackImage(artist)} onError={(event) => handleImageError(event, getArtistFallbackImage(artist))} alt={artist.name} />
      <div>
        <h3>{artist.name}</h3>
        <p>{artist.genre_names || artist.genre || 'Artista independente'}</p>
        <small>{releaseCount} {releaseCount === 1 ? 'lançamento' : 'lançamentos'}</small>
      </div>
    </Link>
  );
}

function ReleaseDetailPage() {
  const { releaseId } = useParams();
  const { user } = useAuth();
  const setPlayerTrack = useContext(PlayerContext);
  const setShellAccent = useContext(ShellAccentContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [releaseInfo, setReleaseInfo] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewGifUrl, setReviewGifUrl] = useState('');
  const [rating, setRating] = useState(8);
  const [message, setMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingRelease, setIsDeletingRelease] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isUploadingReviewGif, setIsUploadingReviewGif] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [preSaved, setPreSaved] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [playlistActionMessage, setPlaylistActionMessage] = useState('');
  const [favoriteTrackIds, setFavoriteTrackIds] = useState([]);
  const [openLyricsTrackId, setOpenLyricsTrackId] = useState(null);
  const [lyricsDisplayMode, setLyricsDisplayMode] = useState('lyrics');
  const releaseCoverUrl = releaseInfo?.release
    ? releaseInfo.release.cover_url || getReleaseFallbackImage(releaseInfo.release)
    : '';
  const releaseAccent = releaseInfo?.release?.accent_color || releaseInfo?.release?.artist_accent_color || '';

  useEffect(() => {
    setShellAccent(releaseAccent);
    return () => setShellAccent('');
  }, [releaseAccent, setShellAccent]);

  const load = async () => {
    const releaseRes = await api.get(`/releases/${releaseId}`);
    setReleaseInfo(releaseRes.data);

    if (user) {
      const [playlistsRes, profileRes, preSaveRes] = await Promise.all([
        api.get('/playlists').catch(() => ({ data: [] })),
        api.get(`/profile/${user.id}`).catch(() => ({ data: { favorites: [] } })),
        api.get(`/pre-saves/${releaseId}`).catch(() => ({ data: { saved: false } })),
      ]);

      setPlaylists(playlistsRes.data || []);
      setSelectedPlaylistId((playlistsRes.data || [])[0]?.id || '');
      setFavoriteTrackIds((profileRes.data?.favorites || []).map((item) => item.track_id));
      setPreSaved(Boolean(preSaveRes.data?.saved));
    }
  };

  useEffect(() => {
    load();
  }, [releaseId, user]);

  useEffect(() => {
    if (!releaseInfo || !isAccountApproved(user) || searchParams.get('review') !== '1') return;
    setIsReviewModalOpen(true);
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('review');
    setSearchParams(nextSearchParams, { replace: true });
  }, [releaseInfo, user, searchParams, setSearchParams]);

  useEffect(() => {
    setOpenLyricsTrackId(null);
    setLyricsDisplayMode('lyrics');
  }, [releaseId]);

  useEffect(() => {
    if (!openLyricsTrackId) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpenLyricsTrackId(null);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [openLyricsTrackId]);

  const togglePreSave = async () => {
    if (!user) return;
    const res = await api.post(`/pre-saves/${releaseId}`);
    setPreSaved(Boolean(res.data.saved));
  };

  const toggleFavoriteTrack = async (trackId) => {
    if (!user) return;
    const res = await api.post(`/favorites/${trackId}`);
    setFavoriteTrackIds((prev) => (res.data.favorite ? [...new Set([...prev, trackId])] : prev.filter((id) => id !== trackId)));
  };

  const addTrackToPlaylist = async (trackId) => {
    if (!user) return;
    if (!selectedPlaylistId) {
      setPlaylistActionMessage('Crie uma playlist no seu perfil antes de adicionar músicas.');
      return;
    }

    setPlaylistActionMessage('');
    try {
      const response = await api.post(`/playlists/${selectedPlaylistId}/tracks`, { track_id: trackId });
      setPlaylistActionMessage(response.data.added ? 'Música adicionada à playlist.' : 'Essa música já está na playlist.');
    } catch (error) {
      setPlaylistActionMessage(error.response?.data?.error || 'Não foi possível adicionar a música.');
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setIsSubmittingReview(true);
    setMessage('');
    try {
      await api.post('/reviews', {
        release_id: Number(releaseId),
        rating,
        review_text: reviewText,
        gif_url: reviewGifUrl,
      });
      setMessage('Avaliação publicada com sucesso.');
      setReviewText('');
      setReviewGifUrl('');
      setIsReviewModalOpen(false);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Não foi possível publicar a avaliação.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const uploadReviewGif = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.type !== 'image/gif') {
      setMessage('Selecione um arquivo GIF válido.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage('O GIF deve ter no máximo 10 MB.');
      return;
    }

    setMessage('');
    setIsUploadingReviewGif(true);
    try {
      setReviewGifUrl(await uploadImage(file));
    } catch (error) {
      setMessage(error.response?.data?.error || 'Não foi possível enviar o GIF.');
    } finally {
      setIsUploadingReviewGif(false);
    }
  };

  const handleReviewLikeChange = (reviewId, liked, likeCount) => {
    setReleaseInfo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        reviews: prev.reviews.map((review) => {
          if (review.id !== reviewId) return review;
          return {
            ...review,
            like_count: likeCount,
            liked_by_user: liked,
          };
        }),
      };
    });
  };

  const handleReviewUpdated = (updatedReview) => {
    setReleaseInfo((current) => current ? ({
      ...current,
      reviews: current.reviews.map((review) => (
        String(review.id) === String(updatedReview.id) ? updatedReview : review
      )),
    }) : current);
  };

  const handleReviewDeleted = (reviewId) => {
    setReleaseInfo((current) => current ? ({
      ...current,
      reviews: current.reviews.filter((review) => String(review.id) !== String(reviewId)),
    }) : current);
  };

  if (!releaseInfo) return <div className="loading-panel">Carregando lançamento…</div>;

  const { release, tracks, reviews } = releaseInfo;
  const canWrite = isAccountApproved(user);
  const selectedLyricsTrack = tracks.find((track) => track.id === openLyricsTrackId);
  const playTrack = (track) => {
    const videoId = getYoutubeVideoId(track.youtube_url || '');
    if (!videoId) return;
    setPlayerTrack({
      videoId,
      title: track.title,
      artistName: release.artist_name || 'Artista',
      releaseTitle: release.title,
    });
  };
  const isFutureRelease = new Date(release.release_date) > new Date();
  const formattedReleaseDate = release.release_date ? new Date(release.release_date + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }) : 'Data indisponível';

  const deleteRelease = async () => {
    const confirmed = window.confirm(
      `Excluir "${release.title}"? As faixas, avaliações, curtidas, favoritos e vínculos em playlists também serão removidos. Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setDeleteError('');
    setIsDeletingRelease(true);
    try {
      await api.delete(`/releases/${release.id}`);
      navigate('/admin', { replace: true });
    } catch (error) {
      setDeleteError(error.response?.data?.error || 'Não foi possível excluir o lançamento. Tente novamente.');
    } finally {
      setIsDeletingRelease(false);
    }
  };

  return (
    <div
      className="content-stack release-view"
      style={{ '--release-accent': releaseAccent || '#31b6c5' }}
    >
      <div className="release-detail glass-panel">
        <ArtworkBackdrop src={releaseCoverUrl} className="release-artwork-backdrop" />
        <img src={releaseCoverUrl} onError={(event) => handleImageError(event, getReleaseFallbackImage(release))} alt={release.title} />
        <div className="release-copy-wrap">
          <p className="eyebrow">{release.release_type}</p>
          <h1>{release.title}</h1>
          <Link to={`/artists/${release.artist_id}`} className="release-artist-link">
            {release.artist_name}
          </Link>
          {(release.featured_artists || []).length > 0 && (
            <p className="release-featured-artists">
              feat. {release.featured_artists.map((artist, index) => (
                <span key={artist.id}>
                  {index > 0 ? ', ' : ''}
                  <Link to={`/artists/${artist.id}`}>{artist.name}</Link>
                </span>
              ))}
            </p>
          )}

          <div className="stats-row">
            <div className="stat-pill">
              <span className="stat-label">Lançamento</span>
              <strong>{formattedReleaseDate}</strong>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Média</span>
              <strong>{Number(release.avg_rating || 0).toFixed(1)}</strong>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Avaliações</span>
              <strong>{release.review_count || 0}</strong>
            </div>
          </div>

          <p className="release-description">
            {release.description || 'A biografia deste álbum ainda não foi cadastrada.'}
          </p>

          <div className="action-row">
            {canWrite && (
              <button className="primary-btn" onClick={togglePreSave} type="button">
                {preSaved ? 'Remover pré-save' : isFutureRelease ? 'Pré-salvar lançamento' : 'Salvar lançamento'}
              </button>
            )}
            {canWrite && (
              <button className="secondary-btn" onClick={() => {
                setMessage('');
                setIsReviewModalOpen(true);
              }} type="button">
                Avaliar
              </button>
            )}
            {user?.role === 'ADMIN' && (
              <Link to={`/admin?editRelease=${release.id}`} className="secondary-btn edit-release-action">
                Editar álbum
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <button
                type="button"
                className="danger-btn compact-btn"
                onClick={deleteRelease}
                disabled={isDeletingRelease}
                aria-label={`Excluir ${release.title}`}
              >
                {isDeletingRelease ? 'Excluindo…' : 'Excluir lançamento'}
              </button>
            )}
          </div>
          {deleteError && <p className="error-text" role="alert">{deleteError}</p>}
        </div>
      </div>

      <section className="subsection album-tracklist-panel">
        <div className="section-heading-row">
          <h3>Lista de faixas</h3>
          <div className="tracklist-playlist-control">
            {canWrite && playlists.length > 0 && (
              <label>
                <span>Adicionar em</span>
                <select value={selectedPlaylistId} onChange={(event) => setSelectedPlaylistId(event.target.value)}>
                  {playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>{playlist.name}</option>
                  ))}
                </select>
              </label>
            )}
            {canWrite && playlists.length === 0 && (
              <Link to={`/profile/${user.id}?tab=playlists`} className="tracklist-create-playlist">Criar playlist</Link>
            )}
            <span>{tracks.length} faixas</span>
          </div>
        </div>
        {playlistActionMessage && <p className="playlist-action-message" role="status">{playlistActionMessage}</p>}
        <div className="tracklist">
          {tracks.map((track) => {
            const isLyricsOpen = openLyricsTrackId === track.id;
            return (
              <div key={track.id} className={`track-item glass-panel ${isLyricsOpen ? 'is-open' : ''}`}>
                <div className="track-row-main">
                  <span className="track-number">{track.track_number}</span>
                  <div className="track-main">
                    <div className="track-text-block">
                      <strong>{track.title}</strong>
                      <small>{track.duration}</small>
                    </div>
                    {Boolean(track.explicit) && (
                      <span className="explicit-tag" aria-label="Conteúdo explícito" title="Conteúdo explícito">
                        E
                      </span>
                    )}
                  </div>
                  <div className="track-actions">
                    {track.youtube_url && (
                      getYoutubeVideoId(track.youtube_url) ? (
                        <button type="button" onClick={() => playTrack(track)} className="track-link-btn">
                          Ouvir
                        </button>
                      ) : (
                        <a href={track.youtube_url} target="_blank" rel="noreferrer" className="track-link-btn">
                          Ouvir
                        </a>
                      )
                    )}
                    {(track.lyrics || track.translation) && (
                      <button
                        type="button"
                        className="ghost-btn track-compact-btn"
                        aria-expanded={isLyricsOpen}
                        onClick={() => {
                          if (isLyricsOpen) {
                            setOpenLyricsTrackId(null);
                          } else {
                            setLyricsDisplayMode(track.lyrics ? 'lyrics' : 'translation');
                            setOpenLyricsTrackId(track.id);
                          }
                        }}
                      >
                        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 4.5h10M5 8h10M5 11.5h7M5 15h5" />
                          <path d="M3 2.5h14v15H3z" />
                        </svg>
                        {isLyricsOpen ? 'Ocultar letra' : 'Ver letra'}
                      </button>
                    )}
                    {canWrite && (
                      <button
                        type="button"
                        className={`ghost-btn track-like-btn${favoriteTrackIds.includes(track.id) ? ' is-favorite' : ''}`}
                        aria-label={favoriteTrackIds.includes(track.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        aria-pressed={favoriteTrackIds.includes(track.id)}
                        onClick={() => toggleFavoriteTrack(track.id)}
                      >
                        {favoriteTrackIds.includes(track.id) ? '♥' : '♡'}
                      </button>
                    )}
                    {canWrite && (
                      <button type="button" className="ghost-btn track-compact-btn playlist-btn" onClick={() => addTrackToPlaylist(track.id)}>
                        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3.5 5h8M3.5 9h8M3.5 13h5" />
                          <path d="M15 10v7m-3.5-3.5h7" />
                        </svg>
                        Playlist
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
          {!tracks.length && <p className="explore-empty-state">Nenhuma faixa cadastrada neste lançamento.</p>}
        </div>
      </section>

      {selectedLyricsTrack && (
        <div
          className="lyrics-viewer-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpenLyricsTrackId(null);
          }}
        >
          <section className="lyrics-viewer" role="dialog" aria-modal="true" aria-labelledby="lyrics-viewer-title">
            <button type="button" className="lyrics-viewer-close" onClick={() => setOpenLyricsTrackId(null)} aria-label="Fechar visualização da letra" autoFocus>
              <span aria-hidden="true">×</span>
            </button>

            <aside className="lyrics-viewer-aside">
              <img src={release.cover_url || getReleaseFallbackImage(release)} onError={(event) => handleImageError(event, getReleaseFallbackImage(release))} alt={`Capa de ${release.title}`} />
              <div className="lyrics-viewer-track-info">
                <p className="lyrics-viewer-eyebrow">FAIXA {selectedLyricsTrack.track_number} · {selectedLyricsTrack.duration}</p>
                <h2>{selectedLyricsTrack.title}</h2>
                <Link to={`/artists/${release.artist_id}`} onClick={() => setOpenLyricsTrackId(null)}>
                  {release.artist_name}
                </Link>
                <span>{release.title}</span>
              </div>
              {selectedLyricsTrack.youtube_url && (
                getYoutubeVideoId(selectedLyricsTrack.youtube_url) ? (
                  <button type="button" className="lyrics-viewer-listen" onClick={() => playTrack(selectedLyricsTrack)}>
                    Ouvir faixa <span aria-hidden="true">↗</span>
                  </button>
                ) : (
                  <a className="lyrics-viewer-listen" href={selectedLyricsTrack.youtube_url} target="_blank" rel="noreferrer">
                    Ouvir faixa <span aria-hidden="true">↗</span>
                  </a>
                )
              )}
            </aside>

            <div className="lyrics-viewer-content">
              <header className="lyrics-viewer-header">
                <div>
                  <p className="lyrics-viewer-eyebrow">LETRA DA MÚSICA</p>
                  <h1 id="lyrics-viewer-title">{selectedLyricsTrack.title}</h1>
                </div>
                <div className="lyrics-viewer-modes" role="group" aria-label="Exibição da letra">
                  <button
                    type="button"
                    className={lyricsDisplayMode === 'lyrics' ? 'is-active' : ''}
                    aria-pressed={lyricsDisplayMode === 'lyrics'}
                    disabled={!selectedLyricsTrack.lyrics}
                    onClick={() => setLyricsDisplayMode('lyrics')}
                  >
                    Letra
                  </button>
                  <button
                    type="button"
                    className={lyricsDisplayMode === 'translation' ? 'is-active' : ''}
                    aria-pressed={lyricsDisplayMode === 'translation'}
                    disabled={!selectedLyricsTrack.translation}
                    onClick={() => setLyricsDisplayMode('translation')}
                  >
                    Tradução
                  </button>
                  <button
                    type="button"
                    className={lyricsDisplayMode === 'both' ? 'is-active' : ''}
                    aria-pressed={lyricsDisplayMode === 'both'}
                    disabled={!selectedLyricsTrack.lyrics || !selectedLyricsTrack.translation}
                    onClick={() => setLyricsDisplayMode('both')}
                  >
                    Ambas
                  </button>
                </div>
              </header>

              <div className={`lyrics-viewer-scroll mode-${lyricsDisplayMode}`}>
                {(lyricsDisplayMode === 'lyrics' || lyricsDisplayMode === 'both') && (
                  <section className="lyrics-column">
                    {lyricsDisplayMode === 'both' && <h3>Letra original</h3>}
                    <p>{selectedLyricsTrack.lyrics || 'A letra original ainda não foi cadastrada.'}</p>
                  </section>
                )}
                {(lyricsDisplayMode === 'translation' || lyricsDisplayMode === 'both') && (
                  <section className="lyrics-column">
                    {lyricsDisplayMode === 'both' && <h3>Tradução</h3>}
                    <p>{selectedLyricsTrack.translation || 'A tradução ainda não foi cadastrada.'}</p>
                  </section>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {isReviewModalOpen && canWrite && (
        <div className="modal-backdrop review-backdrop" onClick={() => !isSubmittingReview && setIsReviewModalOpen(false)}>
          <div
            className="review-modal glass-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="review-modal-header">
              <div>
                <p className="eyebrow">Sua opinião importa</p>
                <h2 id="review-modal-title">Avaliar lançamento</h2>
              </div>
              <button
                type="button"
                className="close-btn review-close-btn"
                aria-label="Fechar avaliação"
                disabled={isSubmittingReview || isUploadingReviewGif}
                onClick={() => setIsReviewModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={submitReview} className="review-form">
              <div className="review-album-summary">
                <img
                  src={release.cover_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80'}
                  alt=""
                />
                <div>
                  <span>{release.release_type}</span>
                  <strong>{release.title}</strong>
                  <small>{release.artist_name}</small>
                </div>
              </div>

              <section className="review-rating-section" aria-labelledby="review-rating-label">
                <div className="review-rating-heading">
                  <div>
                    <h3 id="review-rating-label">Que nota você daria?</h3>
                    <p>Arraste para escolher uma nota de 0 a 10</p>
                  </div>
                  <div className="review-score" aria-live="polite">
                    <strong>{rating}</strong>
                    <span>/10</span>
                  </div>
                </div>
                <input
                  className="review-rating-slider"
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={rating}
                  aria-label={`Nota: ${rating} de 10`}
                  onChange={(e) => setRating(Number(e.target.value))}
                />
                <div className="review-rating-scale" aria-hidden="true">
                  <span>Não gostei</span>
                  <span>Adorei</span>
                </div>
              </section>

              <label className="review-text-label" htmlFor="review-text">
                <span>Conte o que achou <small>opcional</small></span>
                <textarea
                  id="review-text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="O que mais chamou sua atenção neste lançamento?"
                  rows="5"
                  maxLength={300}
                  disabled={isSubmittingReview || isUploadingReviewGif}
                />
                <small className="review-character-count" aria-live="polite">
                  {reviewText.length}/300 caracteres
                </small>
              </label>

              <div className="review-gif-picker">
                <label htmlFor="review-gif-upload">
                  <span aria-hidden="true">▧</span>
                  {isUploadingReviewGif ? 'Enviando GIF…' : reviewGifUrl ? 'Trocar GIF' : 'Adicionar GIF'}
                </label>
                <input
                  id="review-gif-upload"
                  type="file"
                  accept="image/gif,.gif"
                  onChange={uploadReviewGif}
                  disabled={isSubmittingReview || isUploadingReviewGif}
                />
                {reviewGifUrl && (
                  <div className="review-gif-preview">
                    <ReviewGif src={reviewGifUrl} />
                    <button type="button" className="ghost-btn compact-btn" onClick={() => setReviewGifUrl('')}>
                      Remover GIF
                    </button>
                  </div>
                )}
              </div>

              {message && <p className="review-error" role="alert">{message}</p>}

              <div className="review-modal-actions">
                <button
                  className="secondary-btn"
                  type="button"
                  disabled={isSubmittingReview || isUploadingReviewGif}
                  onClick={() => setIsReviewModalOpen(false)}
                >
                  Cancelar
                </button>
                <button className="primary-btn" type="submit" disabled={isSubmittingReview || isUploadingReviewGif}>
                  {isSubmittingReview ? 'Publicando...' : isUploadingReviewGif ? 'Enviando GIF…' : 'Publicar avaliação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="subsection">
        <div className="section-heading-row">
          <h3>Notas sociais</h3>
          <span>{reviews.length} resenhas</span>
        </div>
        <div className="feed-list">
          {reviews.map((review) => (
            <div key={review.id} className="review-feed-item glass-panel">
              <div className="review-head">
                <Link to={`/profile/${review.user_id}`} className="mini-user review-author-link">
                  <img src={review.avatar_url || imagePlaceholder} onError={(event) => handleImageError(event, imagePlaceholder)} alt={review.username} />
                  <div>
                    <strong>{review.username}</strong>
                    <span>{review.created_at}</span>
                  </div>
                </Link>
                <RatingBadge value={review.rating} />
              </div>
              <p>{review.review_text}</p>
              {review.gif_url && <ReviewGif src={review.gif_url} />}
              <div className="review-actions">
                <ReviewLikeButton
                  review={review}
                  user={user}
                  onChange={(liked, likeCount) => handleReviewLikeChange(review.id, liked, likeCount)}
                />
                <ReviewOwnerActions
                  review={review}
                  user={user}
                  onUpdated={handleReviewUpdated}
                  onDeleted={handleReviewDeleted}
                />
              </div>
            </div>
          ))}
          {!reviews.length && <p className="explore-empty-state">Ainda não há resenhas para este lançamento.</p>}
        </div>
      </section>
    </div>
  );
}

function PlaylistPage() {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlistData, setPlaylistData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [trackQuery, setTrackQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', cover_url: '' });

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    api.get(`/playlists/${playlistId}`)
      .then(({ data }) => {
        if (!active) return;
        setPlaylistData(data);
        setForm({
          name: data.playlist.name || '',
          description: data.playlist.description || '',
          cover_url: data.playlist.cover_url || '',
        });
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.error || 'Não foi possível carregar esta playlist.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [playlistId]);

  const isOwner = Boolean(user && playlistData && Number(user.id) === Number(playlistData.playlist.user_id));
  const canManagePlaylist = isOwner && isAccountApproved(user);
  const reloadPlaylist = async () => {
    const response = await api.get(`/playlists/${playlistId}`);
    setPlaylistData(response.data);
    setForm({
      name: response.data.playlist.name || '',
      description: response.data.playlist.description || '',
      cover_url: response.data.playlist.cover_url || '',
    });
  };

  const savePlaylist = async (event) => {
    event.preventDefault();
    setActionError('');
    setIsSaving(true);
    try {
      await api.put(`/playlists/${playlistId}`, form);
      setIsEditing(false);
      await reloadPlaylist();
    } catch (requestError) {
      setActionError(requestError.response?.data?.error || 'Não foi possível salvar as alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePlaylist = async () => {
    if (!window.confirm(`Excluir a playlist "${playlistData.playlist.name}"? Esta ação não pode ser desfeita.`)) return;
    setActionError('');
    try {
      await api.delete(`/playlists/${playlistId}`);
      navigate(`/profile/${playlistData.playlist.user_id}`, { replace: true });
    } catch (requestError) {
      setActionError(requestError.response?.data?.error || 'Não foi possível excluir a playlist.');
    }
  };

  const removeTrack = async (trackId) => {
    setActionError('');
    try {
      await api.delete(`/playlists/${playlistId}/tracks/${trackId}`);
      await reloadPlaylist();
    } catch (requestError) {
      setActionError(requestError.response?.data?.error || 'Não foi possível remover a música.');
    }
  };

  const moveTrack = async (index, direction) => {
    const tracks = [...playlistData.tracks];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= tracks.length) return;
    [tracks[index], tracks[nextIndex]] = [tracks[nextIndex], tracks[index]];
    setActionError('');
    try {
      await api.put(`/playlists/${playlistId}/tracks/order`, {
        track_ids: tracks.map((track) => track.track_id),
      });
      setPlaylistData((current) => ({ ...current, tracks }));
    } catch (requestError) {
      setActionError(requestError.response?.data?.error || 'Não foi possível reordenar as músicas.');
    }
  };

  if (isLoading) {
    return <div className="playlist-page-loading glass-panel" role="status">Carregando playlist…</div>;
  }
  if (error || !playlistData) {
    return (
      <section className="profile-empty-state glass-panel">
        <span aria-hidden="true">♫</span>
        <h1>Playlist indisponível</h1>
        <p>{error || 'Esta playlist não existe ou não está mais disponível.'}</p>
        <Link to="/explore" className="secondary-btn">Explorar música</Link>
      </section>
    );
  }

  const { playlist, tracks } = playlistData;
  const playlistCover = playlist.cover_url || tracks[0]?.release_cover || imagePlaceholder;
  const normalizedTrackQuery = normalizeGenre(trackQuery);
  const visibleTracks = tracks
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => (
      !normalizedTrackQuery
      || normalizeGenre(`${track.track_title} ${track.artist_name} ${track.release_title}`).includes(normalizedTrackQuery)
    ));

  return (
    <div className="content-stack playlist-page">
      <section className="playlist-hero glass-panel">
        <img
          className="playlist-hero-cover"
          src={playlistCover}
          onError={(event) => handleImageError(event, imagePlaceholder)}
          alt={`Capa da playlist ${playlist.name}`}
        />
        <div className="playlist-hero-copy">
          <p className="eyebrow">PLAYLIST</p>
          <h1>{playlist.name}</h1>
          <Link to={`/profile/${playlist.user_id}`} className="playlist-owner-link">
            {playlist.full_name || playlist.username}
          </Link>
          <p>{playlist.description || 'Uma seleção pessoal de músicas.'}</p>
          <span>{tracks.length} {tracks.length === 1 ? 'música' : 'músicas'}</span>
        </div>
        {canManagePlaylist && (
          <div className="playlist-hero-actions">
            <button type="button" className="secondary-btn" onClick={() => setIsEditing((value) => !value)}>
              {isEditing ? 'Cancelar edição' : 'Editar playlist'}
            </button>
            <button type="button" className="danger-btn compact-btn" onClick={deletePlaylist}>
              Excluir
            </button>
          </div>
        )}
      </section>

      {actionError && <p className="playlist-form-error" role="alert">{actionError}</p>}

      {isEditing && canManagePlaylist && (
        <form className="playlist-edit-form glass-panel" onSubmit={savePlaylist}>
          <label className="auth-field">Nome da playlist
            <input
              value={form.name}
              maxLength={191}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label className="auth-field">Descrição
            <textarea
              value={form.description}
              maxLength={2000}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
            />
          </label>
          <label className="auth-field">URL da capa (opcional)
            <input
              type="url"
              value={form.cover_url}
              maxLength={512}
              onChange={(event) => setForm((current) => ({ ...current, cover_url: event.target.value }))}
              placeholder="https://..."
            />
          </label>
          <button type="submit" className="primary-btn" disabled={isSaving}>
            {isSaving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </form>
      )}

      <section className="playlist-track-section">
        <div className="section-heading-row">
          <h2>Músicas</h2>
          <span>{visibleTracks.length} de {tracks.length} faixas</span>
        </div>
        {tracks.length > 0 && (
          <div className="listing-filters playlist-track-filters">
            <input
              type="search"
              value={trackQuery}
              onChange={(event) => setTrackQuery(event.target.value)}
              placeholder="Buscar por faixa, artista ou álbum"
              aria-label="Buscar músicas da playlist"
            />
          </div>
        )}
        {canManagePlaylist && trackQuery.trim() && <p className="image-drop-hint">Limpe a busca para alterar a ordem das faixas.</p>}
        {visibleTracks.length ? (
          <ol className="playlist-track-list">
            {visibleTracks.map(({ track, index }) => (
              <li className="playlist-track-row glass-panel" key={`${track.track_id}-${index}`}>
                <span className="playlist-track-position">{String(index + 1).padStart(2, '0')}</span>
                <img
                  src={track.release_cover || imagePlaceholder}
                  onError={(event) => handleImageError(event, imagePlaceholder)}
                  alt=""
                />
                <div className="playlist-track-copy">
                  <Link to={`/releases/${track.release_id}`} className="playlist-track-title">{track.track_title}</Link>
                  <span>{track.artist_name} · {track.release_title}</span>
                </div>
                {track.youtube_url && (
                  <a href={track.youtube_url} target="_blank" rel="noreferrer" className="track-link-btn">Ouvir</a>
                )}
                <span className="playlist-track-duration">{track.duration || '—'}</span>
                {canManagePlaylist && (
                  <div className="playlist-track-owner-actions">
                    <button type="button" onClick={() => moveTrack(index, -1)} disabled={index === 0 || Boolean(trackQuery.trim())} aria-label={`Mover ${track.track_title} para cima`}>↑</button>
                    <button type="button" onClick={() => moveTrack(index, 1)} disabled={index === tracks.length - 1 || Boolean(trackQuery.trim())} aria-label={`Mover ${track.track_title} para baixo`}>↓</button>
                    <button type="button" onClick={() => removeTrack(track.track_id)} aria-label={`Remover ${track.track_title} da playlist`}>×</button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : tracks.length > 0 ? (
          <p className="explore-empty-state">Nenhuma faixa corresponde à busca.</p>
        ) : (
          <div className="profile-empty-state glass-panel">
            <span aria-hidden="true">♫</span>
            <h3>Esta playlist ainda está vazia</h3>
            <p>{canManagePlaylist ? 'Abra um álbum ou EP e adicione músicas usando o botão “Playlist”.' : 'O proprietário ainda não adicionou músicas.'}</p>
            <Link to="/explore" className="secondary-btn">Explorar lançamentos</Link>
          </div>
        )}
      </section>
    </div>
  );
}

function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileSearchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageUploads, setProfileImageUploads] = useState(0);
  const [activeTab, setActiveTab] = useState(() => (
    profileSearchParams.get('tab') === 'playlists' ? 'playlists' : 'overview'
  ));
  const [form, setForm] = useState({ username: '', full_name: '', bio: '', avatar_url: '', banner_url: '' });
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [playlistCoverUrl, setPlaylistCoverUrl] = useState('');
  const [playlistError, setPlaylistError] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [socialListMode, setSocialListMode] = useState('');
  const [socialUsers, setSocialUsers] = useState([]);
  const [socialListQuery, setSocialListQuery] = useState('');
  const [socialListError, setSocialListError] = useState('');
  const [isLoadingSocialUsers, setIsLoadingSocialUsers] = useState(false);
  const [profileReviewQuery, setProfileReviewQuery] = useState('');
  const [profileReviewRatingFilter, setProfileReviewRatingFilter] = useState('all');
  const [profilePlaylistQuery, setProfilePlaylistQuery] = useState('');
  const [favoriteQuery, setFavoriteQuery] = useState('');

  const loadProfile = async () => {
    const target = userId || user?.id;
    if (!target) return;
    const res = await api.get(`/profile/${target}`);
    setProfile(res.data);
    setForm({
      username: res.data.user.username,
      full_name: res.data.user.full_name,
      bio: res.data.user.bio || '',
      avatar_url: res.data.user.avatar_url || '',
      banner_url: res.data.user.banner_url || '',
    });
  };

  useEffect(() => {
    loadProfile();
  }, [userId, user]);

  useEffect(() => {
    if (profileSearchParams.get('tab') === 'playlists') setActiveTab('playlists');
  }, [profileSearchParams]);

  const saveProfile = async () => {
    await api.put('/users/me', form);
    await loadProfile();
    setIsEditing(false);
  };

  const createPlaylist = async () => {
    const name = playlistName.trim();
    if (!name) {
      setPlaylistError('Dê um nome para sua playlist.');
      return;
    }

    setPlaylistError('');
    setIsCreatingPlaylist(true);
    try {
      const response = await api.post('/playlists', {
        name,
        description: playlistDescription.trim(),
        cover_url: playlistCoverUrl.trim(),
      });
      setPlaylistName('');
      setPlaylistDescription('');
      setPlaylistCoverUrl('');
      await loadProfile();
      navigate(`/playlists/${response.data.playlistId}`);
    } catch (error) {
      setPlaylistError(error.response?.data?.error || 'Não foi possível criar a playlist. Tente novamente.');
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const toggleSocialList = async (mode) => {
    if (socialListMode === mode) {
      setSocialListMode('');
      return;
    }

    setSocialListMode(mode);
    setSocialUsers([]);
    setSocialListQuery('');
    setSocialListError('');
    setIsLoadingSocialUsers(true);
    try {
      const response = await api.get(`/users/${userId || user?.id}/${mode}`);
      setSocialUsers(response.data || []);
    } catch (error) {
      setSocialListError(error.response?.data?.error || 'Não foi possível carregar esta lista.');
    } finally {
      setIsLoadingSocialUsers(false);
    }
  };

  const handleProfileFollowChange = (isFollowing) => {
    setProfile((current) => current ? ({
      ...current,
      social: {
        ...current.social,
        followers: Math.max(0, Number(current.social?.followers || 0) + (isFollowing ? 1 : -1)),
        is_following: isFollowing,
      },
    }) : current);
  };

  const handleReviewUpdated = (updatedReview) => {
    setProfile((current) => current ? ({
      ...current,
      reviews: current.reviews.map((review) => (
        String(review.id) === String(updatedReview.id) ? updatedReview : review
      )),
    }) : current);
  };

  const handleReviewDeleted = (reviewId) => {
    setProfile((current) => current ? ({
      ...current,
      reviews: current.reviews.filter((review) => String(review.id) !== String(reviewId)),
    }) : current);
  };

  if (!profile) return <div className="loading-panel">Carregando perfil…</div>;

  const isOwner = Number(user?.id) === Number(profile.user.id);
  const canManageProfile = isOwner && isAccountApproved(user);
  const profileBannerUrl = profile.user.banner_url || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80';
  const normalizedSocialListQuery = normalizeGenre(socialListQuery);
  const visibleSocialUsers = socialUsers.filter((person) => (
    normalizeGenre(`${person.full_name} ${person.username}`).includes(normalizedSocialListQuery)
  ));
  const normalizedProfileReviewQuery = normalizeGenre(profileReviewQuery);
  const visibleProfileReviews = profile.reviews.filter((review) => (
    (!normalizedProfileReviewQuery || normalizeGenre(`${review.release_title} ${review.artist_name} ${review.review_text}`).includes(normalizedProfileReviewQuery))
    && (profileReviewRatingFilter === 'all' || Number(review.rating || 0) >= Number(profileReviewRatingFilter))
  ));
  const normalizedProfilePlaylistQuery = normalizeGenre(profilePlaylistQuery);
  const visibleProfilePlaylists = profile.playlists.filter((playlist) => (
    !normalizedProfilePlaylistQuery
    || normalizeGenre(`${playlist.name} ${playlist.description}`).includes(normalizedProfilePlaylistQuery)
  ));
  const normalizedFavoriteQuery = normalizeGenre(favoriteQuery);
  const visibleFavorites = profile.favorites.filter((favorite) => (
    !normalizedFavoriteQuery
    || normalizeGenre(`${favorite.track_title} ${favorite.release_title} ${favorite.artist_name}`).includes(normalizedFavoriteQuery)
  ));

  return (
    <div className="content-stack profile-page">
      <div className="profile-hero glass-panel">
        <img className="profile-hero-image" src={profileBannerUrl} onError={(event) => handleImageError(event, imagePlaceholder)} alt="" />
        <div className="profile-copy">
          <img src={profile.user.avatar_url || imagePlaceholder} onError={(event) => handleImageError(event, imagePlaceholder)} alt={profile.user.username} />
          <div className="profile-copy-content">
            <h1>{profile.user.full_name}</h1>
            <p>@{profile.user.username}</p>
            {profile.user.bio && <span>{profile.user.bio}</span>}
          </div>
        </div>
      </div>

      <div className="profile-social-strip">
        <div className="profile-social-counts">
          <button type="button" onClick={() => void toggleSocialList('followers')}>
            <strong>{Number(profile.social?.followers || 0)}</strong><span>Seguidores</span>
          </button>
          <button type="button" onClick={() => void toggleSocialList('following')}>
            <strong>{Number(profile.social?.following || 0)}</strong><span>Seguindo</span>
          </button>
        </div>
        {!isOwner && (
          <FollowButton
            userId={profile.user.id}
            initialFollowing={Boolean(profile.social?.is_following)}
            onChange={handleProfileFollowChange}
          />
        )}
      </div>

      {socialListMode && (
        <section className="profile-social-list glass-panel">
          <div className="profile-social-list-heading">
            <div>
              <p className="eyebrow">Conexões</p>
              <h2>{socialListMode === 'followers' ? 'Seguidores' : 'Seguindo'}</h2>
            </div>
            <button type="button" className="secondary-btn compact-btn" onClick={() => setSocialListMode('')}>Fechar</button>
          </div>
          {!isLoadingSocialUsers && socialUsers.length > 0 && (
            <div className="listing-filters">
              <input
                type="search"
                value={socialListQuery}
                onChange={(event) => setSocialListQuery(event.target.value)}
                placeholder="Buscar pessoa por nome ou usuário"
                aria-label="Buscar pessoas nesta lista"
              />
            </div>
          )}
          {isLoadingSocialUsers ? (
            <p className="profile-social-list-message">Carregando pessoas…</p>
          ) : socialListError ? (
            <p className="error-text" role="alert">{socialListError}</p>
          ) : visibleSocialUsers.length ? (
            <div className="profile-social-user-list">
              {visibleSocialUsers.map((person) => (
                <article key={person.id} className="profile-social-user">
                  <Link to={`/profile/${person.id}`} className="social-user-link">
                    <img src={person.avatar_url || imagePlaceholder} onError={(event) => handleImageError(event, imagePlaceholder)} alt="" />
                    <span className="social-user-copy">
                      <strong>{person.full_name || person.username}</strong>
                      <small>@{person.username}</small>
                    </span>
                  </Link>
                  <FollowButton userId={person.id} initialFollowing={Boolean(person.followed_by_user)} />
                </article>
              ))}
            </div>
          ) : socialUsers.length ? (
            <p className="profile-social-list-message">Nenhuma pessoa corresponde à busca.</p>
          ) : (
            <p className="profile-social-list-message">Ainda não há pessoas nesta lista.</p>
          )}
        </section>
      )}

      <div className="profile-toolbar">
        <div className="profile-tabs" role="tablist" aria-label="Seções do perfil">
          <button type="button" role="tab" aria-selected={activeTab === 'overview'} className={activeTab === 'overview' ? 'is-active' : ''} onClick={() => setActiveTab('overview')}>Visão geral</button>
          <button type="button" role="tab" aria-selected={activeTab === 'reviews'} className={activeTab === 'reviews' ? 'is-active' : ''} onClick={() => setActiveTab('reviews')}>Avaliações</button>
          <button type="button" role="tab" aria-selected={activeTab === 'playlists'} className={activeTab === 'playlists' ? 'is-active' : ''} onClick={() => setActiveTab('playlists')}>Playlists</button>
          <button type="button" role="tab" aria-selected={activeTab === 'favorites'} className={activeTab === 'favorites' ? 'is-active' : ''} onClick={() => setActiveTab('favorites')}>Curtidas</button>
        </div>
        {canManageProfile && (
          <button type="button" className="secondary-btn" onClick={() => setIsEditing((value) => !value)}>
            {isEditing ? 'Cancelar' : 'Editar perfil'}
          </button>
        )}
      </div>

      {isEditing && canManageProfile && (
        <div className="profile-edit glass-panel">
          <h3>Editar perfil</h3>
          <div className="form-grid">
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nome completo" />
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Nome de usuário" />
            <div className="upload-grid">
              <ImageUploadField
                label="Foto do perfil"
                value={form.avatar_url}
                onChange={(value) => setForm({ ...form, avatar_url: value })}
                placeholder="URL da foto de perfil"
                onImageUpload={uploadImage}
                onUploadStateChange={(uploading) => setProfileImageUploads((count) => count + (uploading ? 1 : -1))}
              />
              <ImageUploadField
                label="Banner do perfil"
                value={form.banner_url}
                onChange={(value) => setForm({ ...form, banner_url: value })}
                placeholder="URL do banner do perfil"
                onImageUpload={uploadImage}
                onUploadStateChange={(uploading) => setProfileImageUploads((count) => count + (uploading ? 1 : -1))}
              />
            </div>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Biografia" rows="4" />
          </div>
          <button type="button" className="primary-btn" disabled={profileImageUploads > 0} onClick={saveProfile}>Salvar alterações</button>
        </div>
      )}

      {activeTab === 'overview' && (
        <section className="profile-overview">
          <div className="profile-section-heading">
            <div>
              <p className="eyebrow">Seu espaço Musicfy</p>
              <h2>Visão geral</h2>
              <p>Acompanhe sua atividade e volte ao que você curte.</p>
            </div>
          </div>

          <div className="profile-stat-grid">
            <button type="button" className="profile-stat-card" onClick={() => setActiveTab('reviews')}>
              <span className="profile-stat-icon" aria-hidden="true">✦</span>
              <strong>{profile.reviews.length}</strong>
              <span>Avaliações</span>
            </button>
            <button type="button" className="profile-stat-card" onClick={() => setActiveTab('playlists')}>
              <span className="profile-stat-icon" aria-hidden="true">♫</span>
              <strong>{profile.playlists.length}</strong>
              <span>Playlists</span>
            </button>
            <button type="button" className="profile-stat-card" onClick={() => setActiveTab('favorites')}>
              <span className="profile-stat-icon" aria-hidden="true">♥</span>
              <strong>{profile.favorites.length}</strong>
              <span>Músicas curtidas</span>
            </button>
          </div>

          <article className="profile-bio-card glass-panel">
            <div className="profile-bio-mark" aria-hidden="true">“</div>
            <div>
              <p className="eyebrow">Um pouco sobre</p>
              <h3>{profile.user.full_name}</h3>
              <p>{profile.user.bio || (isOwner ? 'Adicione uma biografia para contar um pouco sobre você e seus gostos musicais.' : 'Este usuário ainda não adicionou uma biografia.')}</p>
            </div>
          </article>
        </section>
      )}

      {activeTab === 'reviews' && (
        <section className="profile-section">
          <div className="profile-section-heading">
            <div>
              <p className="eyebrow">Opiniões e descobertas</p>
              <h2>Avaliações</h2>
              <p>{visibleProfileReviews.length} de {profile.reviews.length} avaliações</p>
            </div>
          </div>
          <div className="listing-filters">
            <input
              type="search"
              value={profileReviewQuery}
              onChange={(event) => setProfileReviewQuery(event.target.value)}
              placeholder="Buscar por álbum, artista ou comentário"
              aria-label="Buscar avaliações do perfil"
            />
            <select aria-label="Filtrar avaliações por nota" value={profileReviewRatingFilter} onChange={(event) => setProfileReviewRatingFilter(event.target.value)}>
              <option value="all">Todas as notas</option>
              <option value="8">Nota 8 ou mais</option>
              <option value="5">Nota 5 ou mais</option>
            </select>
          </div>
          {visibleProfileReviews.length ? (
            <div className="profile-review-list">
              {visibleProfileReviews.map((review) => (
                <article key={review.id} className="profile-review-card glass-panel">
                  <Link to={`/releases/${review.release_id}`} className="profile-review-artwork" aria-label={`Abrir ${review.release_title}`}>
                    <img src={review.release_cover || imagePlaceholder} onError={(event) => handleImageError(event, imagePlaceholder)} alt="" />
                  </Link>
                  <div className="profile-review-copy">
                    <div className="profile-review-heading">
                      <div>
                        <span className="eyebrow">{review.artist_name || 'Lançamento'}</span>
                        <Link to={`/releases/${review.release_id}`} className="profile-review-title">{review.release_title}</Link>
                      </div>
                      <RatingBadge value={review.rating} />
                    </div>
                    <p>{review.review_text || 'Sem comentário escrito.'}</p>
                    {review.gif_url && <ReviewGif src={review.gif_url} />}
                    <small>{review.created_at}</small>
                    <ReviewLikeButton review={review} user={user} />
                    <ReviewOwnerActions
                      review={review}
                      user={user}
                      onUpdated={handleReviewUpdated}
                      onDeleted={handleReviewDeleted}
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : profile.reviews.length ? (
            <p className="explore-empty-state">Nenhuma avaliação corresponde aos filtros.</p>
          ) : (
            <div className="profile-empty-state glass-panel">
              <span aria-hidden="true">✦</span>
              <h3>Suas avaliações aparecem aqui</h3>
              <p>Avalie um álbum ou EP para compartilhar sua opinião com outras pessoas.</p>
              <Link to="/explore" className="secondary-btn">Explorar lançamentos</Link>
            </div>
          )}
        </section>
      )}

      {activeTab === 'playlists' && (
        <section className="profile-section">
          <div className="profile-section-heading">
            <div>
              <p className="eyebrow">Trilhas para cada momento</p>
              <h2>Playlists</h2>
              <p>{visibleProfilePlaylists.length} de {profile.playlists.length} playlists</p>
            </div>
          </div>

          {canManageProfile && (
            <form className="playlist-create-panel glass-panel" onSubmit={(event) => {
              event.preventDefault();
              void createPlaylist();
            }}>
              <div className="playlist-create-art" aria-hidden="true">♫</div>
              <div className="playlist-create-copy">
                <p className="eyebrow">Nova coleção</p>
                <h3>Crie a trilha do seu próximo momento</h3>
                <p>Defina os detalhes e adicione músicas aos poucos para montar sua seleção.</p>
                <div className="playlist-create-form">
                  <input
                    value={playlistName}
                    maxLength={191}
                    onChange={(event) => {
                      setPlaylistName(event.target.value);
                      setPlaylistError('');
                    }}
                    placeholder="Ex.: Noites tranquilas"
                    aria-label="Nome da playlist"
                    required
                    disabled={isCreatingPlaylist}
                  />
                  <textarea
                    value={playlistDescription}
                    maxLength={2000}
                    onChange={(event) => setPlaylistDescription(event.target.value)}
                    placeholder="Descrição (opcional)"
                    aria-label="Descrição da playlist"
                    rows={2}
                    disabled={isCreatingPlaylist}
                  />
                  <input
                    type="url"
                    value={playlistCoverUrl}
                    maxLength={512}
                    onChange={(event) => setPlaylistCoverUrl(event.target.value)}
                    placeholder="URL da capa (opcional)"
                    aria-label="URL da capa da playlist"
                    disabled={isCreatingPlaylist}
                  />
                  <button type="submit" className="primary-btn" disabled={isCreatingPlaylist}>
                    {isCreatingPlaylist ? 'Criando...' : 'Criar playlist'}
                  </button>
                </div>
                {playlistError && <p className="playlist-form-error" role="alert">{playlistError}</p>}
              </div>
            </form>
          )}

          <div className="listing-filters">
            <input
              type="search"
              value={profilePlaylistQuery}
              onChange={(event) => setProfilePlaylistQuery(event.target.value)}
              placeholder="Buscar playlists por nome ou descrição"
              aria-label="Buscar playlists do perfil"
            />
          </div>
          {visibleProfilePlaylists.length ? (
            <div className="profile-playlist-grid">
              {visibleProfilePlaylists.map((playlist) => (
                <Link to={`/playlists/${playlist.id}`} key={playlist.id} className="profile-playlist-card glass-panel">
                  <div className="profile-playlist-artwork">
                    <img src={playlist.cover_url || imagePlaceholder} onError={(event) => handleImageError(event, imagePlaceholder)} alt="" />
                    <span aria-hidden="true">♫</span>
                  </div>
                  <div className="profile-playlist-copy">
                    <h3>{playlist.name}</h3>
                    <p>{playlist.description || 'Uma seleção pessoal de músicas.'}</p>
                    <small>{Number(playlist.track_count || 0)} {Number(playlist.track_count || 0) === 1 ? 'música' : 'músicas'}</small>
                  </div>
                  <span className="profile-playlist-open" aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          ) : profile.playlists.length ? (
            <p className="explore-empty-state">Nenhuma playlist corresponde à busca.</p>
          ) : (
            <div className="profile-empty-state glass-panel">
              <span aria-hidden="true">♫</span>
              <h3>Nenhuma playlist por enquanto</h3>
              <p>{isOwner ? 'Crie uma playlist para organizar as músicas que combinam com você.' : 'Este usuário ainda não criou playlists.'}</p>
            </div>
          )}
        </section>
      )}

      {activeTab === 'favorites' && (
        <section className="profile-section">
          <div className="profile-section-heading">
            <div>
              <p className="eyebrow">Músicas que ficam com você</p>
              <h2>Curtidas</h2>
              <p>{visibleFavorites.length} de {profile.favorites.length} músicas curtidas</p>
            </div>
          </div>
          <div className="listing-filters">
            <input
              type="search"
              value={favoriteQuery}
              onChange={(event) => setFavoriteQuery(event.target.value)}
              placeholder="Buscar música, artista ou álbum"
              aria-label="Buscar músicas curtidas"
            />
          </div>
          {visibleFavorites.length ? (
            <div className="profile-favorite-grid">
              {visibleFavorites.map((favorite) => (
                <Link key={favorite.id} to={`/releases/${favorite.release_id}`} className="profile-favorite-card glass-panel">
                  <img src={favorite.release_cover || imagePlaceholder} onError={(event) => handleImageError(event, imagePlaceholder)} alt="" />
                  <div>
                    <span className="profile-favorite-heart" aria-hidden="true">♥</span>
                    <h3>{favorite.track_title}</h3>
                    <p>{favorite.artist_name}</p>
                    <small>{favorite.release_title}</small>
                  </div>
                  <span className="profile-favorite-open" aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          ) : profile.favorites.length ? (
            <p className="explore-empty-state">Nenhuma música corresponde à busca.</p>
          ) : (
            <div className="profile-empty-state glass-panel">
              <span aria-hidden="true">♥</span>
              <h3>Suas músicas curtidas aparecem aqui</h3>
              <p>Toque no coração em uma música para guardá-la nesta coleção.</p>
              <Link to="/explore" className="secondary-btn">Encontrar músicas</Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function AuthPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', full_name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [registrationApprovalRequired, setRegistrationApprovalRequired] = useState(null);
  const [registrationSettingsError, setRegistrationSettingsError] = useState('');

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    let active = true;
    api.get('/auth/registration-settings')
      .then(({ data }) => {
        if (active) setRegistrationApprovalRequired(Boolean(data.approval_required));
      })
      .catch((settingsError) => {
        console.error('Unable to load registration settings:', settingsError);
        if (active) setRegistrationSettingsError('Não foi possível carregar as configurações de aprovação.');
      });

    return () => { active = false; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login' ? { username: form.username, password: form.password } : { ...form };
      const res = await api.post(url, payload);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Falha na autenticação.');
    }
  };

  return (
    <div className="auth-wrap">
      <section className="auth-intro">
        <div className="auth-intro-brand">
          <span className="auth-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </span>
          <span><strong>MUSICFY</strong><small>O SOM DA SUA COMUNIDADE</small></span>
        </div>

        <div className="auth-intro-copy">
          <p className="auth-eyebrow">OUÇA. SINTA. COMPARTILHE.</p>
          <h1>Seu próximo <span>álbum favorito</span> está por aqui.</h1>
          <p>Encontre lançamentos, descubra artistas e compartilhe o que a música faz você sentir.</p>
        </div>

        <div className="auth-community-card">
          <div className="auth-waveform" aria-hidden="true">{Array.from({ length: 19 }, (_, index) => <i key={index} />)}</div>
          <div><strong>Mais do que dar o play.</strong><span>Uma comunidade feita para quem vive música.</span></div>
          <span className="auth-community-icon" aria-hidden="true">+</span>
        </div>
      </section>

      <div className="auth-box glass-panel">
        <div className="auth-box-heading">
          <p className="auth-eyebrow">{mode === 'login' ? 'BOM TER VOCÊ DE VOLTA' : 'ENTRE PARA A COMUNIDADE'}</p>
          <h2>{mode === 'login' ? 'A música continua.' : 'Sua jornada começa aqui.'}</h2>
          <p>{mode === 'login' ? 'Entre na sua conta para continuar.' : 'Crie sua conta e encontre seu próximo som favorito.'}</p>
        </div>

        <div className="auth-toggle" role="group" aria-label="Tipo de acesso">
          <button aria-pressed={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }} type="button">Entrar</button>
          <button aria-pressed={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }} type="button">Criar conta</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <>
              <label className="auth-field">Nome
                <input autoComplete="given-name" placeholder="Como podemos chamar você?" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </label>
              <label className="auth-field">E-mail
                <input type="email" autoComplete="email" placeholder="voce@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </label>
            </>
          )}

          <label className="auth-field">Nome de usuário
            <input autoComplete="username" placeholder="Seu nome de usuário" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </label>
          <label className="auth-field">Senha
            <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Sua senha" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>

          {mode === 'register' && (
            <label className="auth-field">Confirmar senha
              <input type="password" autoComplete="new-password" placeholder="Digite a senha novamente" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
            </label>
          )}

          {error && <p className="error-text" role="alert">{error}</p>}
          {mode === 'register' && registrationApprovalRequired !== null && (
            <p className="auth-registration-note" role="status">
              {registrationApprovalRequired
                ? 'Após o cadastro, seu perfil aguardará aprovação do ADM antes de liberar interações.'
                : 'A aprovação manual está desativada. Você poderá interagir assim que criar sua conta.'}
            </p>
          )}
          {mode === 'register' && registrationSettingsError && (
            <p className="auth-registration-note" role="status">{registrationSettingsError}</p>
          )}
          <button className="primary-btn auth-submit" type="submit">
            {mode === 'login' ? 'Entrar no Musicfy' : 'Criar minha conta'}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="auth-privacy-note">Sua próxima descoberta musical está a poucos segundos.</p>
      </div>
    </div>
  );
}

function ImageUploadField({ label, value, onChange, placeholder, hint, onImageUpload, onUploadStateChange }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleSelectedFile = async (file) => {
    if (!file) return;

    const supportedType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
    const supportedExtension = /\.(jpe?g|png|gif|webp)$/i.test(file.name);
    if (!supportedType && !supportedExtension) {
      setUploadError('Selecione uma imagem JPG, PNG, GIF ou WebP.');
      return;
    }

    setUploadError('');
    setIsUploading(true);
    onUploadStateChange?.(true);
    try {
      onChange(await onImageUpload(file));
    } catch (error) {
      console.error('Image upload failed:', error);
      setUploadError(error.response?.data?.error || 'Não foi possível enviar a imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
      onUploadStateChange?.(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    void handleSelectedFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    void handleSelectedFile(file);
  };

  return (
    <div
      className={`image-upload-field glass-panel ${isDragging ? 'is-dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="image-upload-header">
        <span>{label}</span>
        <button type="button" className="secondary-btn compact-btn" disabled={isUploading} onClick={() => inputRef.current?.click()}>
          {isUploading ? 'Enviando...' : 'Carregar imagem'}
        </button>
      </div>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.gif,.webp" hidden onChange={handleFileChange} />
      <div className="image-preview">
        {value ? (
          <img src={value} alt={label} />
        ) : (
          <div className="image-empty-state">Sem imagem</div>
        )}
      </div>
      <div className="image-drop-hint">{hint || 'Arraste e solte ou use a URL abaixo'}</div>
      {uploadError && <p className="image-upload-error" role="alert">{uploadError}</p>}
      <input type="url" maxLength={512} value={value} placeholder={placeholder} disabled={isUploading} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AdminPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeAdminSection, setActiveAdminSection] = useState('catalog');
  const [stats, setStats] = useState({ artists: { count: 0 }, releases: { count: 0 }, users: { count: 0 }, reviews: { count: 0 } });
  const [artistList, setArtistList] = useState([]);
  const [releaseList, setReleaseList] = useState([]);
  const [featuredList, setFeaturedList] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [moderationQuery, setModerationQuery] = useState('');
  const [moderationUserStatus, setModerationUserStatus] = useState('all');
  const [moderationReviewRating, setModerationReviewRating] = useState('all');
  const [artistListQuery, setArtistListQuery] = useState('');
  const [artistListGenre, setArtistListGenre] = useState('Todos');
  const [releaseListQuery, setReleaseListQuery] = useState('');
  const [releaseListType, setReleaseListType] = useState('Todos');
  const [featuredListQuery, setFeaturedListQuery] = useState('');
  const [isLoadingModeration, setIsLoadingModeration] = useState(false);
  const [profileApprovalEnabled, setProfileApprovalEnabled] = useState(null);
  const [isLoadingProfileApproval, setIsLoadingProfileApproval] = useState(true);
  const [isSavingProfileApproval, setIsSavingProfileApproval] = useState(false);
  const [artistImageUploads, setArtistImageUploads] = useState(0);
  const [isReleaseCoverUploading, setIsReleaseCoverUploading] = useState(false);
  const [editingArtistId, setEditingArtistId] = useState(null);
  const [editingReleaseId, setEditingReleaseId] = useState(null);
  const [editingFeaturedId, setEditingFeaturedId] = useState(null);
  const [adminError, setAdminError] = useState('');
  const [adminNotice, setAdminNotice] = useState('');
  const [musicBrainzArtistResults, setMusicBrainzArtistResults] = useState([]);
  const [musicBrainzReleaseResults, setMusicBrainzReleaseResults] = useState([]);
  const [musicBrainzReleaseQuery, setMusicBrainzReleaseQuery] = useState('');
  const [isSearchingMusicBrainzArtists, setIsSearchingMusicBrainzArtists] = useState(false);
  const [isSearchingMusicBrainzReleases, setIsSearchingMusicBrainzReleases] = useState(false);
  const [loadingMusicBrainzReleaseId, setLoadingMusicBrainzReleaseId] = useState('');
  const [artistForm, setArtistForm] = useState({ name: '', bio: '', image_url: '', banner_url: '', genres: '', accent_color: '' });
  const [releaseForm, setReleaseForm] = useState({
    title: '',
    artist_id: '',
    artist_name: '',
    featured_artist_ids: [],
    accent_color: '',
    cover_url: '',
    release_type: 'Album',
    release_date: '',
    genre: '',
    description: '',
    tracks: [{ title: '', duration: '3:00', explicit: false, youtube_url: '', lyrics: '', translation: '' }],
  });
  const [genreOptions, setGenreOptions] = useState(MUSIC_GENRES);
  const [newGenreName, setNewGenreName] = useState('');
  const [isCreatingGenre, setIsCreatingGenre] = useState(false);
  const [featuredForm, setFeaturedForm] = useState({ release_id: '', sort_order: 1, banner_url: '', description: '' });
  const [isFeaturedBannerUploading, setIsFeaturedBannerUploading] = useState(false);

  const reportAdminError = (error, fallback) => {
    const message = error.response?.data?.error;
    setAdminNotice('');
    setAdminError(typeof message === 'string' && message ? message : fallback);
  };

  const refreshCatalogLists = async () => {
    try {
      const [artistsRes, releasesRes, featuredRes, genresRes] = await Promise.all([
        api.get('/artists'),
        api.get('/releases'),
        api.get('/admin/featured'),
        api.get('/genres'),
      ]);
      setArtistList(artistsRes.data || []);
      setReleaseList(releasesRes.data || []);
      setFeaturedList(featuredRes.data || []);
      setGenreOptions(mergeGenreOptions(genresRes.data));
    } catch (error) {
      console.error(error);
      reportAdminError(error, 'Não foi possível carregar o catálogo. Consulte os logs do servidor.');
    }
  };

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setStats(res.data))
      .catch((error) => reportAdminError(error, 'Não foi possível carregar o painel administrativo.'));
    api.get('/admin/settings/profile-approval')
      .then(({ data }) => setProfileApprovalEnabled(Boolean(data.enabled)))
      .catch((error) => reportAdminError(error, 'Não foi possível carregar a configuração de aprovação de perfis.'))
      .finally(() => setIsLoadingProfileApproval(false));
    refreshCatalogLists();
  }, [user]);

  useEffect(() => {
    if (!['approvals', 'moderation'].includes(activeAdminSection)) return undefined;
    let active = true;
    setIsLoadingModeration(true);
    const userRequest = activeAdminSection === 'approvals'
      ? api.get('/admin/users?approval=pending')
      : api.get('/admin/users');
    const reviewRequest = activeAdminSection === 'moderation'
      ? api.get('/admin/reviews')
      : Promise.resolve({ data: [] });
    Promise.all([userRequest, reviewRequest])
      .then(([usersResponse, reviewsResponse]) => {
        if (!active) return;
        setAdminUsers(usersResponse.data || []);
        if (activeAdminSection === 'moderation') setAdminReviews(reviewsResponse.data || []);
      })
      .catch((error) => {
        if (active) reportAdminError(error, activeAdminSection === 'approvals'
          ? 'Não foi possível carregar os perfis pendentes.'
          : 'Não foi possível carregar as ferramentas de moderação.');
      })
      .finally(() => {
        if (active) setIsLoadingModeration(false);
      });

    return () => { active = false; };
  }, [activeAdminSection]);

  const resetArtistForm = () => {
    setEditingArtistId(null);
    setArtistForm({ name: '', bio: '', image_url: '', banner_url: '', genres: '', accent_color: '' });
    setMusicBrainzArtistResults([]);
  };

  const searchMusicBrainzArtists = async () => {
    const query = artistForm.name.trim();
    if (!query) {
      setAdminError('Informe o nome do artista para buscar no MusicBrainz.');
      return;
    }

    setAdminError('');
    setAdminNotice('');
    setMusicBrainzArtistResults([]);
    setIsSearchingMusicBrainzArtists(true);
    try {
      const response = await api.get('/admin/musicbrainz/artists', { params: { q: query } });
      setMusicBrainzArtistResults(response.data || []);
      if (!response.data?.length) setAdminNotice('Nenhum artista encontrado no MusicBrainz.');
    } catch (error) {
      reportAdminError(error, 'Não foi possível consultar o MusicBrainz agora.');
    } finally {
      setIsSearchingMusicBrainzArtists(false);
    }
  };

  const searchMusicBrainzReleases = async () => {
    const query = musicBrainzReleaseQuery.trim();
    if (!releaseForm.artist_name) {
      setAdminError('Selecione um artista cadastrado antes de buscar lançamentos.');
      return;
    }
    if (!query) {
      setAdminError('Informe o título do lançamento para buscar no MusicBrainz.');
      return;
    }

    setAdminError('');
    setAdminNotice('');
    setMusicBrainzReleaseResults([]);
    setIsSearchingMusicBrainzReleases(true);
    try {
      const response = await api.get('/admin/musicbrainz/releases', {
        params: { q: query, artist: releaseForm.artist_name },
      });
      setMusicBrainzReleaseResults(response.data || []);
      if (!response.data?.length) setAdminNotice('Nenhum lançamento encontrado no MusicBrainz para esse artista e título.');
    } catch (error) {
      reportAdminError(error, 'Não foi possível consultar o MusicBrainz agora.');
    } finally {
      setIsSearchingMusicBrainzReleases(false);
    }
  };

  const importMusicBrainzRelease = async (release) => {
    const hasTrackDetails = releaseForm.tracks.some((track) => (
      track.title || track.youtube_url || track.lyrics || track.translation
    ));
    if (hasTrackDetails && !window.confirm('Importar esta lista substituirá as faixas preenchidas no formulário. Deseja continuar?')) {
      return;
    }

    setAdminError('');
    setAdminNotice('');
    setLoadingMusicBrainzReleaseId(release.id);
    try {
      const response = await api.get(`/admin/musicbrainz/releases/${release.id}`);
      const importedTracks = (response.data.tracks || []).map((track) => ({
        title: track.title || '',
        duration: track.duration || '',
        explicit: false,
        youtube_url: '',
        lyrics: '',
        translation: '',
      }));
      const primaryType = release.type === 'EP' || release.type === 'Single' ? release.type : 'Album';
      setReleaseForm((current) => ({
        ...current,
        title: release.title,
        release_type: primaryType,
        release_date: response.data.release_date || '',
        cover_url: response.data.cover_url || current.cover_url,
        genre: [...new Map(
          [...splitGenreNames(current.genre), ...(release.genres || [])]
            .map((genre) => [normalizeGenre(genre), genre])
        ).values()].join(', '),
        tracks: importedTracks.length ? importedTracks : current.tracks,
      }));
      setGenreOptions((current) => mergeGenreOptions([...current, ...(release.genres || [])]));
      setMusicBrainzReleaseQuery(release.title);
      const dateNotice = !response.data.release_date
        ? ' O MusicBrainz não forneceu uma data completa; informe-a antes de salvar.'
        : '';
      setAdminNotice(importedTracks.length
        ? `Dados e faixas importados. Revise tudo antes de salvar; biografia, imagem do artista, letras e links não são fornecidos pelo MusicBrainz.${dateNotice}`
        : `Dados importados, mas o MusicBrainz não forneceu uma lista de faixas para este lançamento.${dateNotice}`);
    } catch (error) {
      reportAdminError(error, 'Não foi possível carregar as faixas no MusicBrainz agora.');
    } finally {
      setLoadingMusicBrainzReleaseId('');
    }
  };

  const submitArtist = async (e) => {
    e.preventDefault();
    setAdminError('');
    const payload = {
      ...artistForm,
      genres: artistForm.genres.split(',').map((g) => g.trim()).filter(Boolean),
    };

    try {
      if (editingArtistId) {
        await api.put(`/artists/${editingArtistId}`, payload);
      } else {
        await api.post('/artists', payload);
      }

      alert(editingArtistId ? 'Artista atualizado com sucesso.' : 'Artista criado.');
      resetArtistForm();
      refreshCatalogLists();
    } catch (error) {
      reportAdminError(error, 'Não foi possível salvar o artista. Consulte os logs do servidor.');
    }
  };

  const updateTrack = (index, field, value) => {
    setReleaseForm((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track, trackIndex) => (trackIndex === index ? { ...track, [field]: value } : track)),
    }));
  };

  const toggleReleaseGenre = (genre) => {
    setReleaseForm((current) => {
      const currentGenres = splitGenreNames(current.genre);
      const selected = currentGenres.some((item) => normalizeGenre(item) === normalizeGenre(genre));
      const nextGenres = selected
        ? currentGenres.filter((item) => normalizeGenre(item) !== normalizeGenre(genre))
        : [...currentGenres, genre];

      return { ...current, genre: nextGenres.join(', ') };
    });
  };

  const selectReleaseGenre = (genre) => {
    setReleaseForm((current) => {
      const currentGenres = splitGenreNames(current.genre);
      if (currentGenres.some((item) => normalizeGenre(item) === normalizeGenre(genre))) return current;
      return { ...current, genre: [...currentGenres, genre].join(', ') };
    });
  };

  const createReleaseGenre = async () => {
    const name = newGenreName.trim().replace(/\s+/g, ' ');
    if (!name) return;

    setAdminError('');
    setAdminNotice('');
    const existing = genreOptions.find((genre) => normalizeGenre(genre) === normalizeGenre(name));
    if (existing) {
      selectReleaseGenre(existing);
      setNewGenreName('');
      setAdminNotice(`O gênero "${existing}" já existe e foi selecionado.`);
      return;
    }

    setIsCreatingGenre(true);
    try {
      const response = await api.post('/genres', { name });
      const createdGenre = response.data?.name;
      if (typeof createdGenre !== 'string' || !createdGenre.trim()) {
        throw new Error('A resposta do servidor não contém o gênero criado.');
      }

      setGenreOptions((current) => mergeGenreOptions([...current, createdGenre]));
      selectReleaseGenre(createdGenre);
      setNewGenreName('');
      setAdminNotice(`Gênero "${createdGenre}" criado e selecionado.`);
    } catch (error) {
      reportAdminError(error, 'Não foi possível criar o gênero.');
    } finally {
      setIsCreatingGenre(false);
    }
  };

  const addTrackRow = () => {
    setReleaseForm((prev) => ({
      ...prev,
      tracks: [...prev.tracks, { title: '', duration: '3:00', explicit: false, youtube_url: '', lyrics: '', translation: '' }],
    }));
  };

  const removeTrackRow = (index) => {
    setReleaseForm((prev) => ({
      ...prev,
      tracks: prev.tracks.filter((_, trackIndex) => trackIndex !== index),
    }));
  };

  const resetReleaseForm = () => {
    setEditingReleaseId(null);
    setNewGenreName('');
    setMusicBrainzReleaseQuery('');
    setMusicBrainzReleaseResults([]);
    setReleaseForm({
      title: '',
      artist_id: '',
      artist_name: '',
      featured_artist_ids: [],
      accent_color: '',
      cover_url: '',
      release_type: 'Album',
      release_date: '',
      genre: '',
      description: '',
      tracks: [{ title: '', duration: '3:00', explicit: false, youtube_url: '', lyrics: '', translation: '' }],
    });
  };

  const submitRelease = async (e) => {
    e.preventDefault();
    setAdminError('');

    const validTracks = releaseForm.tracks
      .filter((track) => track.title || track.youtube_url || track.lyrics || track.translation)
      .map((track, index) => ({
        title: track.title || `Faixa ${index + 1}`,
        duration: track.duration || '',
        explicit: Boolean(track.explicit),
        youtube_url: track.youtube_url || '',
        lyrics: track.lyrics || '',
        translation: track.translation || '',
      }));

    const payload = {
      ...releaseForm,
      artist_id: releaseForm.artist_id ? Number(releaseForm.artist_id) : undefined,
      artist_name: releaseForm.artist_name || undefined,
      tracks: validTracks,
    };
    try {
      if (editingReleaseId) {
        await api.put(`/releases/${editingReleaseId}`, payload);
      } else {
        await api.post('/releases', payload);
      }

      alert(editingReleaseId ? 'Álbum atualizado com sucesso.' : 'Lançamento criado.');
      resetReleaseForm();
      refreshCatalogLists();
    } catch (error) {
      reportAdminError(error, 'Não foi possível salvar o lançamento. Confira a data e o artista.');
    }
  };

  const resetCatalog = async () => {
    const confirmed = window.confirm('Deseja zerar todos os artistas e lançamentos da plataforma? Esta ação não remove usuários.');
    if (!confirmed) return;

    setAdminError('');
    try {
      await api.post('/admin/reset-catalog');
      alert('Catálogo zerado. Você pode criar novos artistas e álbuns agora.');
      api.get('/dashboard').then((res) => setStats(res.data)).catch(console.error);
      refreshCatalogLists();
    } catch (error) {
      reportAdminError(error, 'Não foi possível zerar o catálogo. Consulte os logs do servidor.');
    }
  };

  const submitFeatured = async (e) => {
    e.preventDefault();
    setAdminError('');
    const releaseId = Number(featuredForm.release_id);
    const sortOrder = Number(featuredForm.sort_order);
    const bannerUrl = featuredForm.banner_url.trim();
    const description = featuredForm.description.trim();

    if (!Number.isSafeInteger(releaseId) || releaseId < 1) {
      setAdminError('Selecione um lançamento para destacar.');
      return;
    }
    if (!bannerUrl) {
      setAdminError('Escolha ou carregue um banner para o destaque.');
      return;
    }
    if (!description || description.length > 600) {
      setAdminError('Escreva uma descrição de até 600 caracteres para o destaque.');
      return;
    }
    if (!Number.isSafeInteger(sortOrder) || sortOrder < 1) {
      setAdminError('A ordem do destaque deve ser um número inteiro positivo.');
      return;
    }

    try {
      await api.post('/admin/featured', {
        release_id: releaseId,
        sort_order: sortOrder,
        banner_url: bannerUrl,
        description,
      });
      alert(editingFeaturedId ? 'Destaque atualizado no carrossel da página inicial.' : 'Destaque salvo no carrossel da página inicial.');
      setEditingFeaturedId(null);
      setFeaturedForm({ release_id: '', sort_order: 1, banner_url: '', description: '' });
      refreshCatalogLists();
    } catch (error) {
      reportAdminError(error, 'Não foi possível salvar o destaque. Confira o lançamento selecionado.');
    }
  };

  const handleFeaturedEdit = (featured) => {
    setAdminError('');
    setEditingFeaturedId(featured.id);
    setFeaturedForm({
      release_id: String(featured.release_id),
      sort_order: featured.sort_order,
      banner_url: featured.banner_url || '',
      description: featured.description || '',
    });
    document.getElementById('featured-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const cancelFeaturedEdit = () => {
    setEditingFeaturedId(null);
    setFeaturedForm({ release_id: '', sort_order: 1, banner_url: '', description: '' });
    setAdminError('');
  };

  const handleFeaturedDelete = async (featuredId) => {
    if (!window.confirm('Remover este banner do carrossel? O álbum continuará no catálogo.')) return;
    setAdminError('');
    try {
      await api.delete(`/admin/featured/${featuredId}`);
      setFeaturedList((current) => current.filter((item) => item.id !== featuredId));
      if (editingFeaturedId === featuredId) cancelFeaturedEdit();
    } catch (error) {
      reportAdminError(error, 'Não foi possível remover o destaque.');
    }
  };

  const handleArtistEdit = (artist) => {
    setEditingArtistId(artist.id);
    setArtistForm({
      name: artist.name || '',
      bio: artist.bio || '',
      image_url: artist.image_url || '',
      banner_url: artist.banner_url || '',
      genres: artist.genre_names || artist.genre || '',
      accent_color: artist.accent_color || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleArtistDelete = async (artistId) => {
    if (!window.confirm('Deseja excluir este artista e seus lançamentos?')) return;
    setAdminError('');
    try {
      await api.delete(`/artists/${artistId}`);
      alert('Artista removido.');
      if (editingArtistId === artistId) resetArtistForm();
      refreshCatalogLists();
      api.get('/dashboard').then((res) => setStats(res.data)).catch(console.error);
    } catch (error) {
      reportAdminError(error, 'Não foi possível excluir o artista. Consulte os logs do servidor.');
    }
  };

  const handleReleaseEdit = async (release) => {
    const detail = await api.get(`/releases/${release.id}`);
    const tracks = detail.data.tracks?.map((track) => ({
      id: track.id,
      title: track.title || '',
      duration: track.duration || '',
      explicit: Boolean(track.explicit),
      youtube_url: track.youtube_url || '',
      lyrics: track.lyrics || '',
      translation: track.translation || '',
    })) || [{ title: '', duration: '3:00', explicit: false, youtube_url: '', lyrics: '', translation: '' }];

    setReleaseForm({
      title: detail.data.release.title || '',
      artist_id: detail.data.release.artist_id ? String(detail.data.release.artist_id) : '',
      artist_name: detail.data.release.artist_name || '',
      featured_artist_ids: (detail.data.release.featured_artists || []).map((artist) => String(artist.id)),
      accent_color: detail.data.release.accent_color || '',
      cover_url: detail.data.release.cover_url || '',
      release_type: detail.data.release.release_type || 'Album',
      release_date: detail.data.release.release_date || '',
      genre: detail.data.release.genre || '',
      description: detail.data.release.description || '',
      tracks,
    });
    setMusicBrainzReleaseQuery(detail.data.release.title || '');
    setMusicBrainzReleaseResults([]);
    setGenreOptions((current) => mergeGenreOptions([...current, ...splitGenreNames(detail.data.release.genre)]));
    setEditingReleaseId(release.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const releaseIdToEdit = searchParams.get('editRelease');
    if (!releaseIdToEdit || !releaseList.length) return;

    const release = releaseList.find((item) => String(item.id) === releaseIdToEdit);
    if (!release) return;

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('editRelease');
      return next;
    }, { replace: true });
    handleReleaseEdit(release);
  }, [releaseList, searchParams, setSearchParams]);

  useEffect(() => {
    const artistIdToEdit = searchParams.get('editArtist');
    if (!artistIdToEdit) return;

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('editArtist');
      return next;
    }, { replace: true });

    api.get(`/artists/${encodeURIComponent(artistIdToEdit)}`)
      .then((res) => handleArtistEdit({
        ...res.data.artist,
        genre_names: (res.data.genres || []).join(', '),
      }))
      .catch((error) => reportAdminError(error, 'Não foi possível carregar o artista para edição.'));
  }, [searchParams, setSearchParams]);

  const handleReleaseDelete = async (releaseId) => {
    if (!window.confirm('Deseja excluir este lançamento?')) return;
    setAdminError('');
    try {
      await api.delete(`/releases/${releaseId}`);
      alert('Lançamento removido.');
      refreshCatalogLists();
      api.get('/dashboard').then((res) => setStats(res.data)).catch(console.error);
    } catch (error) {
      reportAdminError(error, 'Não foi possível excluir o lançamento. Consulte os logs do servidor.');
    }
  };

  const handleUserSuspend = async (targetUser) => {
    if (!window.confirm(`Ocultar o perfil de ${targetUser.full_name || targetUser.username}? A pessoa poderá entrar apenas para ler o aviso e a conta poderá ser reativada.`)) return;
    setAdminError('');
    setAdminNotice('');
    try {
      await api.delete(`/admin/users/${targetUser.id}`);
      setAdminUsers((current) => current.map((item) => (
        item.id === targetUser.id ? { ...item, is_suspended: true } : item
      )));
      setAdminNotice('Perfil ocultado. A pessoa recebeu uma notificação e terá acesso restrito.');
    } catch (error) {
      reportAdminError(error, 'Não foi possível ocultar este perfil.');
    }
  };

  const handleUserRestore = async (targetUser) => {
    setAdminError('');
    setAdminNotice('');
    try {
      await api.post(`/admin/users/${targetUser.id}/restore`);
      setAdminUsers((current) => current.map((item) => (
        item.id === targetUser.id ? { ...item, is_suspended: false } : item
      )));
      setAdminNotice('Perfil reativado. A pessoa foi avisada.');
    } catch (error) {
      reportAdminError(error, 'Não foi possível reativar este perfil.');
    }
  };

  const handleUserApprove = async (targetUser) => {
    setAdminError('');
    setAdminNotice('');
    try {
      await api.post(`/admin/users/${targetUser.id}/approve`);
      setAdminUsers((current) => current.filter((item) => item.id !== targetUser.id));
      setAdminNotice(`O perfil de ${targetUser.full_name || targetUser.username} foi aprovado e recebeu uma notificação.`);
    } catch (error) {
      reportAdminError(error, 'Não foi possível aprovar este perfil.');
    }
  };

  const updateProfileApprovalSetting = async (enabled) => {
    if (!enabled && !window.confirm(
      'Desativar a aprovação manual libera imediatamente todos os perfis que estão aguardando aprovação. Deseja continuar?'
    )) {
      return;
    }

    setAdminError('');
    setAdminNotice('');
    setIsSavingProfileApproval(true);
    try {
      const { data } = await api.put('/admin/settings/profile-approval', { enabled });
      setProfileApprovalEnabled(data.enabled);
      if (!data.enabled) setAdminUsers([]);
      const approvedCount = Number(data.approved_count || 0);
      setAdminNotice(data.enabled
        ? 'Aprovação manual ativada. Novos perfis precisarão ser aprovados pelo ADM.'
        : approvedCount
          ? `Aprovação manual desativada. ${approvedCount} ${approvedCount === 1 ? 'perfil pendente foi liberado' : 'perfis pendentes foram liberados'}; as pessoas devem atualizar a página.`
          : 'Aprovação manual desativada. Novos perfis serão liberados automaticamente.');
    } catch (error) {
      reportAdminError(error, 'Não foi possível atualizar a configuração de aprovação de perfis.');
    } finally {
      setIsSavingProfileApproval(false);
    }
  };

  const handleAdminReviewDelete = async (review) => {
    if (!window.confirm(`Remover a resenha de ${review.full_name || review.username} sobre ${review.release_title}? O autor será notificado.`)) return;
    setAdminError('');
    setAdminNotice('');
    try {
      await api.delete(`/reviews/${review.id}`);
      setAdminReviews((current) => current.filter((item) => item.id !== review.id));
      setStats((current) => ({
        ...current,
        reviews: { count: Math.max(0, Number(current.reviews?.count || 0) - 1) },
      }));
      setAdminNotice('Resenha removida e seu autor foi notificado.');
    } catch (error) {
      reportAdminError(error, 'Não foi possível remover esta resenha.');
    }
  };

  const moderationSearch = normalizeGenre(moderationQuery);
  const filteredAdminUsers = adminUsers.filter((item) => (
    Number(item.is_approved)
    && (!moderationSearch || normalizeGenre(`${item.full_name || ''} ${item.username || ''} ${item.email || ''}`).includes(moderationSearch))
    && (moderationUserStatus === 'all' || (moderationUserStatus === 'suspended' ? Boolean(Number(item.is_suspended)) : !Number(item.is_suspended)))
  ));
  const filteredAdminReviews = adminReviews.filter((item) => (
    (!moderationSearch || normalizeGenre(`${item.full_name || ''} ${item.username || ''} ${item.release_title || ''} ${item.artist_name || ''} ${item.review_text || ''}`).includes(moderationSearch))
    && (moderationReviewRating === 'all' || Number(item.rating || 0) >= Number(moderationReviewRating))
  ));
  const normalizedArtistListQuery = normalizeGenre(artistListQuery);
  const filteredAdminArtists = artistList.filter((artist) => (
    (!normalizedArtistListQuery || normalizeGenre(`${artist.name} ${artist.genre_names || artist.genre}`).includes(normalizedArtistListQuery))
    && (artistListGenre === 'Todos' || splitGenreNames(artist.genre_names || artist.genre).map(normalizeGenre).includes(normalizeGenre(artistListGenre)))
  ));
  const normalizedReleaseListQuery = normalizeGenre(releaseListQuery);
  const filteredAdminReleases = releaseList.filter((release) => (
    (!normalizedReleaseListQuery || normalizeGenre(`${release.title} ${release.artist_name}`).includes(normalizedReleaseListQuery))
    && (releaseListType === 'Todos' || release.release_type === releaseListType)
  ));
  const normalizedFeaturedListQuery = normalizeGenre(featuredListQuery);
  const filteredFeaturedList = featuredList.filter((featured) => (
    !normalizedFeaturedListQuery
    || normalizeGenre(`${featured.title} ${featured.artist_name} ${featured.description}`).includes(normalizedFeaturedListQuery)
  ));
  const selectedReleaseGenres = splitGenreNames(releaseForm.genre).map(normalizeGenre);

  return (
    <div className="content-stack">
      <div className="section-header"><h2>Painel administrativo</h2></div>
      {adminError && <p className="error-text" role="alert">{adminError}</p>}
      {adminNotice && <p className="admin-notice" role="status">{adminNotice}</p>}

      <div className="stats-grid">
        <div className="stat-card glass-panel"><span>Artistas</span><strong>{stats.artists?.count || 0}</strong></div>
        <div className="stat-card glass-panel"><span>Lançamentos</span><strong>{stats.releases?.count || 0}</strong></div>
        <div className="stat-card glass-panel"><span>Usuários</span><strong>{stats.users?.count || 0}</strong></div>
        <div className="stat-card glass-panel"><span>Avaliações</span><strong>{stats.reviews?.count || 0}</strong></div>
      </div>

      <nav className="admin-section-nav" aria-label="Seções administrativas">
        {[
          { id: 'catalog', label: 'Catálogo', description: 'Artistas e lançamentos' },
          { id: 'homepage', label: 'Destaques', description: 'Carrossel da página inicial' },
          { id: 'approvals', label: 'Aprovações', description: 'Perfis aguardando revisão' },
          { id: 'moderation', label: 'Moderação', description: 'Perfis e resenhas' },
        ].map((section) => (
          <button
            key={section.id}
            id={`admin-tab-${section.id}`}
            type="button"
            aria-pressed={activeAdminSection === section.id}
            className={`admin-section-tab${activeAdminSection === section.id ? ' is-active' : ''}`}
            onClick={() => {
              setActiveAdminSection(section.id);
              setAdminError('');
              setAdminNotice('');
            }}
          >
            <strong>{section.label}</strong>
            <span>{section.description}</span>
          </button>
        ))}
      </nav>

      {activeAdminSection === 'catalog' && (
        <section aria-labelledby="admin-tab-catalog" className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span className="admin-section-kicker">Gerenciar conteúdo</span>
              <h3>Catálogo musical</h3>
              <p>Cadastre artistas e organize seus álbuns, EPs e singles.</p>
            </div>
          </div>

          <div className="admin-stack">
        <form className="admin-form glass-panel" onSubmit={submitArtist}>
          <div className="admin-form-header">
            <div>
              <h3>{editingArtistId ? 'Editar artista' : 'Criar artista'}</h3>
              <span>{editingArtistId ? 'Atualize o perfil e a identidade visual' : 'Perfil e identidade visual'}</span>
            </div>
            {editingArtistId && (
              <div className="admin-form-header-actions">
                <button type="button" className="ghost-btn compact-btn" onClick={resetArtistForm}>
                  Cancelar edição
                </button>
                <button type="button" className="ghost-btn secondary-btn" onClick={() => handleArtistDelete(editingArtistId)}>
                  Excluir artista
                </button>
              </div>
            )}
          </div>
          <input
            placeholder="Nome do artista"
            value={artistForm.name}
            onChange={(e) => {
              setArtistForm({ ...artistForm, name: e.target.value });
              setMusicBrainzArtistResults([]);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void searchMusicBrainzArtists();
              }
            }}
          />
          <div className="musicbrainz-search">
            <p>Busque o catálogo do MusicBrainz para preencher nome e gêneros. Biografia e imagens são mantidas para edição manual.</p>
            <button type="button" className="secondary-btn compact-btn" disabled={isSearchingMusicBrainzArtists} onClick={searchMusicBrainzArtists}>
              {isSearchingMusicBrainzArtists ? 'Buscando artistas…' : 'Buscar artista no MusicBrainz'}
            </button>
            {!!musicBrainzArtistResults.length && (
              <div className="musicbrainz-results" aria-label="Resultados de artistas do MusicBrainz">
                {musicBrainzArtistResults.map((artist) => (
                  <div className="musicbrainz-result" key={artist.id}>
                    <div>
                      <strong>{artist.name}</strong>
                      <small>{[artist.type, artist.country, artist.disambiguation].filter(Boolean).join(' · ') || 'Sem detalhes adicionais'}</small>
                      {!!artist.genres?.length && <small>Gêneros: {artist.genres.join(', ')}</small>}
                    </div>
                    <div className="musicbrainz-result-actions">
                      <a href={`https://musicbrainz.org/artist/${artist.id}`} target="_blank" rel="noreferrer">MusicBrainz</a>
                      <button
                        type="button"
                        className="ghost-btn compact-btn"
                        onClick={() => {
                          setArtistForm((current) => ({
                            ...current,
                            name: artist.name,
                            genres: artist.genres?.length ? artist.genres.join(', ') : current.genres,
                          }));
                          setMusicBrainzArtistResults([]);
                          setAdminNotice('Dados do artista importados. Confira se é o artista correto e complete a biografia e as imagens do site.');
                        }}
                      >
                        Usar dados
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <textarea placeholder="Biografia" value={artistForm.bio} onChange={(e) => setArtistForm({ ...artistForm, bio: e.target.value })} />
          <div className="upload-grid">
            <ImageUploadField
              label="Foto do artista"
              value={artistForm.image_url}
              onChange={(value) => setArtistForm({ ...artistForm, image_url: value })}
              placeholder="https://..."
              onImageUpload={uploadImage}
              onUploadStateChange={(uploading) => setArtistImageUploads((count) => count + (uploading ? 1 : -1))}
            />
            <ImageUploadField
              label="Banner do artista"
              value={artistForm.banner_url}
              onChange={(value) => setArtistForm({ ...artistForm, banner_url: value })}
              placeholder="https://..."
              hint="JPG, PNG, GIF ou WebP de até 10 MB. Você também pode informar uma URL."
              onImageUpload={uploadImage}
              onUploadStateChange={(uploading) => setArtistImageUploads((count) => count + (uploading ? 1 : -1))}
            />
          </div>
          <input placeholder="Gêneros, separados por vírgula" value={artistForm.genres} onChange={(e) => setArtistForm({ ...artistForm, genres: e.target.value })} />
          <AccentPicker
            label="Cor temática do artista"
            value={artistForm.accent_color}
            onChange={(color) => setArtistForm((prev) => ({ ...prev, accent_color: color }))}
          />
          <button type="submit" className="primary-btn" disabled={artistImageUploads > 0}>{editingArtistId ? 'Salvar alterações' : 'Criar artista'}</button>
        </form>

        <form className="admin-form glass-panel" onSubmit={submitRelease}>
          <div className="admin-form-header release-form-header">
            <div>
              <h3>{editingReleaseId ? 'Editar álbum' : 'Criar álbum'}</h3>
              <span>{editingReleaseId ? 'Atualize os dados e faixas do lançamento' : 'Álbum, EP ou single'}</span>
            </div>
            {editingReleaseId && (
              <button type="button" className="ghost-btn compact-btn" onClick={resetReleaseForm}>
                Cancelar edição
              </button>
            )}
          </div>
          <input
            placeholder="Título do lançamento"
            value={releaseForm.title}
            onChange={(e) => {
              setReleaseForm({ ...releaseForm, title: e.target.value });
              setMusicBrainzReleaseQuery(e.target.value);
              setMusicBrainzReleaseResults([]);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void searchMusicBrainzReleases();
              }
            }}
          />
          <select
            aria-label="Artista do lançamento"
            required
            value={releaseForm.artist_id}
            onChange={(e) => {
              const selectedArtist = artistList.find((artist) => String(artist.id) === e.target.value);
              setReleaseForm({
                ...releaseForm,
                artist_id: e.target.value,
                artist_name: selectedArtist?.name || '',
              });
              setMusicBrainzReleaseResults([]);
            }}
          >
            <option value="">{artistList.length ? 'Selecione um artista cadastrado' : 'Cadastre um artista primeiro'}</option>
            {artistList.map((artist) => (
              <option key={artist.id} value={artist.id}>{artist.name}</option>
            ))}
          </select>
          {!artistList.length && <p className="image-drop-hint">Crie um artista no formulário acima para vinculá-lo a este lançamento.</p>}
          <div className="musicbrainz-search">
            <input
              aria-label="Título para buscar no MusicBrainz"
              placeholder="Buscar lançamento por título no MusicBrainz"
              value={musicBrainzReleaseQuery}
              onChange={(event) => {
                setMusicBrainzReleaseQuery(event.target.value);
                setMusicBrainzReleaseResults([]);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void searchMusicBrainzReleases();
                }
              }}
            />
            <button
              type="button"
              className="secondary-btn compact-btn"
              disabled={isSearchingMusicBrainzReleases || !releaseForm.artist_id}
              onClick={searchMusicBrainzReleases}
            >
              {isSearchingMusicBrainzReleases ? 'Buscando lançamentos…' : 'Buscar lançamento no MusicBrainz'}
            </button>
            {!!musicBrainzReleaseResults.length && (
              <div className="musicbrainz-results" aria-label="Resultados de lançamentos do MusicBrainz">
                {musicBrainzReleaseResults.map((release) => (
                  <div className="musicbrainz-result" key={release.id}>
                    <div>
                      <strong>{release.title}</strong>
                      <small>{[release.artist, release.type, release.date].filter(Boolean).join(' · ') || 'Sem detalhes adicionais'}</small>
                      {!!release.genres?.length && <small>Gêneros: {release.genres.join(', ')}</small>}
                    </div>
                    <div className="musicbrainz-result-actions">
                      <a href={`https://musicbrainz.org/release-group/${release.id}`} target="_blank" rel="noreferrer">MusicBrainz</a>
                      <button
                        type="button"
                        className="ghost-btn compact-btn"
                        disabled={Boolean(loadingMusicBrainzReleaseId)}
                        onClick={() => importMusicBrainzRelease(release)}
                      >
                        {loadingMusicBrainzReleaseId === release.id ? 'Importando…' : 'Usar dados e faixas'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <small className="musicbrainz-attribution">Dados catalográficos fornecidos pelo <a href="https://musicbrainz.org/" target="_blank" rel="noreferrer">MusicBrainz</a>; capas podem vir do <a href="https://coverartarchive.org/" target="_blank" rel="noreferrer">Cover Art Archive</a>. Revise antes de salvar.</small>
          </div>
          <ImageUploadField
            label="Capa do lançamento"
            value={releaseForm.cover_url}
            onChange={(value) => setReleaseForm({ ...releaseForm, cover_url: value })}
            placeholder="https://..."
            onImageUpload={uploadImage}
            onUploadStateChange={setIsReleaseCoverUploading}
          />
          <AccentPicker
            label="Cor temática do lançamento"
            value={releaseForm.accent_color}
            onChange={(color) => setReleaseForm((current) => ({ ...current, accent_color: color }))}
          />
          <select value={releaseForm.release_type} onChange={(e) => setReleaseForm({ ...releaseForm, release_type: e.target.value })}>
            <option>Album</option>
            <option>EP</option>
            <option>Single</option>
          </select>
          <input type="date" value={releaseForm.release_date} onChange={(e) => setReleaseForm({ ...releaseForm, release_date: e.target.value })} />
          <div className="release-genre-picker">
            <div className="release-genre-heading">
              <strong>Gêneros musicais</strong>
              <span>Selecione um ou mais</span>
            </div>
            <div className="release-genre-tags" role="group" aria-label="Gêneros musicais">
              {genreOptions.map((genre) => (
                <button
                  type="button"
                  className={`release-genre-tag${selectedReleaseGenres.includes(normalizeGenre(genre)) ? ' is-selected' : ''}`}
                  key={genre}
                  aria-pressed={selectedReleaseGenres.includes(normalizeGenre(genre))}
                  onClick={() => toggleReleaseGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
            <div className="release-genre-create">
              <input
                aria-label="Nome do novo gênero"
                placeholder="Nome do novo gênero"
                value={newGenreName}
                onChange={(event) => setNewGenreName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void createReleaseGenre();
                  }
                }}
              />
              <button
                type="button"
                className="secondary-btn compact-btn"
                disabled={!newGenreName.trim() || isCreatingGenre}
                onClick={createReleaseGenre}
              >
                {isCreatingGenre ? 'Criando…' : '+ Criar tag'}
              </button>
            </div>
          </div>
          <textarea placeholder="Descrição" value={releaseForm.description} onChange={(e) => setReleaseForm({ ...releaseForm, description: e.target.value })} />

          <div className="track-editor">
            <div className="track-editor-header">
              <div>
                <h4>Faixas do álbum</h4>
                <p>Edite os dados principais e expanda os detalhes quando precisar.</p>
              </div>
              <button type="button" className="secondary-btn compact-btn" onClick={addTrackRow}>+ Adicionar faixa</button>
            </div>
            {releaseForm.tracks.map((track, index) => (
              <div key={track.id ? `track-${track.id}` : `draft-${index}`} className="track-row track-editor-card glass-panel">
                <div className="track-editor-card-heading">
                  <span className="track-editor-number">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>Faixa {index + 1}</strong>
                    <small>{track.title || 'Adicione o título da música'}</small>
                  </div>
                  {releaseForm.tracks.length > 1 && (
                    <button type="button" className="ghost-btn compact-btn track-editor-remove" onClick={() => removeTrackRow(index)}>
                      Remover
                    </button>
                  )}
                </div>

                <div className="track-editor-main-grid">
                  <input aria-label={`Nome da faixa ${index + 1}`} value={track.title} onChange={(e) => updateTrack(index, 'title', e.target.value)} placeholder="Nome da faixa" />
                  <input aria-label={`Duração da faixa ${index + 1}`} value={track.duration} onChange={(e) => updateTrack(index, 'duration', e.target.value)} placeholder="Duração (ex.: 3:42)" />
                  <label className="check-inline">
                    <input type="checkbox" checked={track.explicit} onChange={(e) => updateTrack(index, 'explicit', e.target.checked)} />
                    Explícita
                  </label>
                </div>

                <details className="track-editor-details">
                  <summary>Letra, tradução e link do YouTube</summary>
                  <div className="track-editor-extra">
                    <input aria-label={`Link do YouTube da faixa ${index + 1}`} value={track.youtube_url} onChange={(e) => updateTrack(index, 'youtube_url', e.target.value)} placeholder="Link do YouTube" />
                    <div className="track-editor-lyrics-grid">
                      <label>
                        Letra original
                        <textarea value={track.lyrics} onChange={(e) => updateTrack(index, 'lyrics', e.target.value)} placeholder="Cole a letra aqui" rows="4" />
                      </label>
                      <label>
                        Tradução
                        <textarea value={track.translation} onChange={(e) => updateTrack(index, 'translation', e.target.value)} placeholder="Cole a tradução aqui" rows="4" />
                      </label>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>

          <button type="submit" className="primary-btn" disabled={isReleaseCoverUploading}>{editingReleaseId ? 'Salvar alterações' : 'Criar lançamento'}</button>
        </form>
          </div>

          <div className="admin-listing-panel glass-panel">
            <div className="section-header compact"><h3>Artistas cadastrados <span className="admin-count">{filteredAdminArtists.length}/{artistList.length}</span></h3></div>
            <div className="listing-filters">
              <input
                type="search"
                value={artistListQuery}
                onChange={(event) => setArtistListQuery(event.target.value)}
                placeholder="Buscar artista ou gênero"
                aria-label="Buscar artistas cadastrados"
              />
              <select aria-label="Filtrar artistas cadastrados por gênero" value={artistListGenre} onChange={(event) => setArtistListGenre(event.target.value)}>
                <option>Todos</option>
                {genreOptions.map((genre) => <option key={genre}>{genre}</option>)}
              </select>
            </div>
            <div className="admin-list-grid">
              {filteredAdminArtists.map((artist) => (
                <div key={artist.id} className="admin-list-item">
                  <img src={artist.image_url || artist.banner_url || getArtistFallbackImage(artist)} onError={(event) => handleImageError(event, getArtistFallbackImage(artist))} alt="" />
                  <div className="admin-list-copy">
                    <strong>{artist.name}</strong>
                    <small>{artist.genre_names || artist.genre || 'Sem gênero'}</small>
                  </div>
                  <div className="admin-list-actions">
                    <button type="button" className="secondary-btn compact-btn" onClick={() => handleArtistEdit(artist)}>Editar</button>
                    <button type="button" className="danger-btn compact-btn" onClick={() => handleArtistDelete(artist.id)}>Excluir</button>
                  </div>
                </div>
              ))}
              {!filteredAdminArtists.length && <p className="admin-empty-state">{artistList.length ? 'Nenhum artista corresponde aos filtros.' : 'Nenhum artista cadastrado ainda.'}</p>}
            </div>
          </div>

          <div className="admin-listing-panel glass-panel">
            <div className="section-header compact"><h3>Lançamentos cadastrados <span className="admin-count">{filteredAdminReleases.length}/{releaseList.length}</span></h3></div>
            <div className="listing-filters">
              <input
                type="search"
                value={releaseListQuery}
                onChange={(event) => setReleaseListQuery(event.target.value)}
                placeholder="Buscar por álbum ou artista"
                aria-label="Buscar lançamentos cadastrados"
              />
              <select aria-label="Filtrar lançamentos cadastrados por tipo" value={releaseListType} onChange={(event) => setReleaseListType(event.target.value)}>
                <option>Todos</option>
                <option>Album</option>
                <option>EP</option>
                <option>Single</option>
              </select>
            </div>
            <div className="admin-list-grid">
              {filteredAdminReleases.map((release) => (
                <div key={release.id} className="admin-list-item">
                  <img src={release.cover_url || getReleaseFallbackImage(release)} onError={(event) => handleImageError(event, getReleaseFallbackImage(release))} alt="" />
                  <div className="admin-list-copy">
                    <strong>{release.title}</strong>
                    <small>{[release.artist_name, ...(release.featured_artists || []).map((artist) => artist.name)].filter(Boolean).join(' feat. ')} · {release.release_type}</small>
                  </div>
                  <div className="admin-list-actions">
                    <button type="button" className="secondary-btn compact-btn" onClick={() => handleReleaseEdit(release)}>Editar</button>
                    <button type="button" className="danger-btn compact-btn" onClick={() => handleReleaseDelete(release.id)}>Excluir</button>
                  </div>
                </div>
              ))}
              {!filteredAdminReleases.length && <p className="admin-empty-state">{releaseList.length ? 'Nenhum lançamento corresponde aos filtros.' : 'Nenhum lançamento cadastrado ainda.'}</p>}
            </div>
          </div>
        </section>
      )}

      {activeAdminSection === 'homepage' && (
        <section aria-labelledby="admin-tab-homepage" className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span className="admin-section-kicker">Vitrine da comunidade</span>
              <h3>Carrossel da página inicial</h3>
              <p>Escolha os lançamentos, banners, descrições e a ordem em que aparecem.</p>
            </div>
          </div>
          <div className="admin-stack">
        <form id="featured-form" className={`admin-form glass-panel${editingFeaturedId ? ' is-editing-featured' : ''}`} onSubmit={submitFeatured}>
          <div className="admin-form-header">
            <div>
              <h3>{editingFeaturedId ? 'Editar destaque' : 'Criar destaque'}</h3>
              <span>{editingFeaturedId ? 'Atualize o banner, a descrição ou a posição deste slide.' : 'Adicione um álbum ao carrossel da página inicial.'}</span>
            </div>
          </div>
          <select
            required
            aria-label="Lançamento do destaque"
            disabled={editingFeaturedId !== null}
            value={featuredForm.release_id}
            onChange={(e) => setFeaturedForm({ ...featuredForm, release_id: e.target.value })}
          >
            <option value="">Selecione um lançamento</option>
            {releaseList.map((release) => (
              <option key={release.id} value={release.id}>{release.title} • {release.artist_name}</option>
            ))}
          </select>
          <ImageUploadField
            label="Banner do destaque"
            value={featuredForm.banner_url}
            onChange={(value) => setFeaturedForm({ ...featuredForm, banner_url: value })}
            placeholder="https://..."
            hint="Escolha uma imagem horizontal ou informe uma URL."
            onImageUpload={uploadImage}
            onUploadStateChange={setIsFeaturedBannerUploading}
          />
          <textarea
            required
            maxLength={600}
            rows="4"
            value={featuredForm.description}
            onChange={(e) => setFeaturedForm({ ...featuredForm, description: e.target.value })}
            placeholder="Escreva uma descrição convidativa para este álbum"
          />
          <input
            type="number"
            min="1"
            step="1"
            required
            value={featuredForm.sort_order}
            onChange={(e) => setFeaturedForm({ ...featuredForm, sort_order: e.target.value })}
            placeholder="Ordem no carrossel"
          />
          <button type="submit" className="primary-btn" disabled={isFeaturedBannerUploading}>
            {isFeaturedBannerUploading ? 'Enviando banner…' : editingFeaturedId ? 'Salvar alterações' : 'Salvar destaque'}
          </button>
          {editingFeaturedId && (
            <button type="button" className="secondary-btn" onClick={cancelFeaturedEdit}>Cancelar edição</button>
          )}
        </form>
          </div>
          <div className="admin-listing-panel glass-panel">
        <div className="section-header compact">
          <div>
            <h3>Destaques do carrossel <span className="admin-count">{filteredFeaturedList.length}/{featuredList.length}</span></h3>
            <p>Adicione outros álbuns no formulário acima; cada lançamento vira um slide.</p>
          </div>
        </div>
        <div className="listing-filters">
          <input
            type="search"
            value={featuredListQuery}
            onChange={(event) => setFeaturedListQuery(event.target.value)}
            placeholder="Buscar por álbum, artista ou descrição"
            aria-label="Buscar destaques do carrossel"
          />
        </div>
        <div className="admin-list-grid">
          {filteredFeaturedList.map((featured) => (
            <div key={featured.id} className="admin-list-item featured-admin-list-item">
              <img
                src={featured.banner_url || featured.cover_url || getReleaseFallbackImage(featured)}
                onError={(event) => handleImageError(event, featured.cover_url || getReleaseFallbackImage(featured))}
                alt=""
              />
              <div className="featured-admin-copy">
                <strong>{featured.title}</strong>
                <small>{featured.artist_name} · posição {featured.sort_order}</small>
                <p>{featured.description || 'Sem descrição'}</p>
              </div>
              <div className="admin-list-actions">
                <button type="button" className="secondary-btn compact-btn" onClick={() => handleFeaturedEdit(featured)}>
                  Editar banner
                </button>
                <button type="button" className="danger-btn compact-btn" onClick={() => handleFeaturedDelete(featured.id)}>
                  Remover banner
                </button>
              </div>
            </div>
          ))}
          {!filteredFeaturedList.length && <p className="admin-empty-state">{featuredList.length ? 'Nenhum destaque corresponde à busca.' : 'Nenhum destaque publicado ainda. Use o formulário acima para criar o primeiro.'}</p>}
        </div>
          </div>
        </section>
      )}

      {activeAdminSection === 'approvals' && (
        <section aria-labelledby="admin-tab-approvals" className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span className="admin-section-kicker">Revisão de contas</span>
              <h3>Aprovação de novos perfis</h3>
              <p>Escolha se novos cadastros precisam de liberação manual para interagir na plataforma.</p>
            </div>
          </div>
          <div className="approval-setting-card glass-panel">
            <div className="approval-setting-copy">
              <strong>Exigir aprovação do ADM</strong>
              <p>
                {profileApprovalEnabled === null
                  ? 'Carregando a configuração de aprovação.'
                  : profileApprovalEnabled
                    ? 'Novas contas poderão navegar, mas precisarão ser aprovadas para interagir.'
                    : 'Novas contas serão aprovadas automaticamente após o cadastro.'}
              </p>
            </div>
            <label className="approval-setting-toggle">
              <input
                type="checkbox"
                role="switch"
                checked={profileApprovalEnabled === true}
                disabled={isLoadingProfileApproval || isSavingProfileApproval || profileApprovalEnabled === null}
                onChange={(event) => updateProfileApprovalSetting(event.target.checked)}
              />
              <span>
                {isLoadingProfileApproval
                  ? 'Carregando…'
                  : isSavingProfileApproval
                    ? 'Salvando…'
                    : profileApprovalEnabled === null
                      ? 'Indisponível'
                      : profileApprovalEnabled
                        ? 'Ativada'
                        : 'Desativada'}
              </span>
            </label>
          </div>
          <div className="admin-listing-panel glass-panel">
            <div className="admin-list-grid">
              {isLoadingModeration && <p className="admin-empty-state">Carregando perfis pendentes…</p>}
              {!isLoadingModeration && adminUsers.map((adminUser) => (
                <article key={adminUser.id} className="admin-list-item approval-user">
                  <img
                    className="approval-user-avatar"
                    src={adminUser.avatar_url || imagePlaceholder}
                    onError={(event) => handleImageError(event, imagePlaceholder)}
                    alt=""
                  />
                  <div className="admin-list-copy">
                    <strong>{adminUser.full_name || adminUser.username}</strong>
                    <small>@{adminUser.username} · {adminUser.email}</small>
                    <p>{adminUser.bio || 'Sem biografia cadastrada.'}</p>
                    <small>Cadastro: {new Date(adminUser.created_at).toLocaleDateString('pt-BR')}</small>
                  </div>
                  <div className="admin-list-actions">
                    <Link to={`/profile/${adminUser.id}`} className="secondary-btn compact-btn">Ver perfil</Link>
                    <button type="button" className="primary-btn compact-btn" onClick={() => handleUserApprove(adminUser)}>
                      Aprovar perfil
                    </button>
                  </div>
                </article>
              ))}
              {!isLoadingModeration && !adminUsers.length && (
                <p className="admin-empty-state">Não há perfis aguardando aprovação.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {activeAdminSection === 'moderation' && (
        <section aria-labelledby="admin-tab-moderation" className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span className="admin-section-kicker">Segurança e comunidade</span>
              <h3>Moderação</h3>
              <p>Oculte e restaure perfis ou remova resenhas. As pessoas afetadas recebem um aviso no app.</p>
            </div>
          </div>
          <label className="admin-moderation-search">
            <span>Buscar por pessoa, álbum ou conteúdo</span>
            <input
              type="search"
              value={moderationQuery}
              onChange={(event) => setModerationQuery(event.target.value)}
              placeholder="Digite um nome, e-mail, álbum ou trecho da resenha"
            />
          </label>
          <div className="admin-moderation-grid">
            <div className="admin-listing-panel glass-panel">
              <div className="section-header compact">
                <h3>Perfis <span className="admin-count">{filteredAdminUsers.length}</span></h3>
              </div>
              <div className="listing-filters">
                <select aria-label="Filtrar perfis por status" value={moderationUserStatus} onChange={(event) => setModerationUserStatus(event.target.value)}>
                  <option value="all">Todos os perfis</option>
                  <option value="active">Perfis ativos</option>
                  <option value="suspended">Perfis ocultos</option>
                </select>
              </div>
              <div className="admin-list-grid">
                {isLoadingModeration && <p className="admin-empty-state">Carregando perfis…</p>}
                {!isLoadingModeration && filteredAdminUsers.map((adminUser) => (
                  <div key={adminUser.id} className={`admin-list-item moderation-user${adminUser.is_suspended ? ' is-suspended' : ''}`}>
                    <div className="moderation-avatar" aria-hidden="true">
                      {(adminUser.full_name || adminUser.username || '?').slice(0, 1).toLocaleUpperCase()}
                    </div>
                    <div className="admin-list-copy">
                      <strong>{adminUser.full_name || adminUser.username}</strong>
                      <small>@{adminUser.username} · {adminUser.email}</small>
                      <span className={`moderation-status${adminUser.is_suspended ? ' is-suspended' : ''}`}>
                        {adminUser.is_suspended ? 'Perfil oculto' : 'Perfil ativo'}
                      </span>
                    </div>
                    {adminUser.is_suspended ? (
                      <button type="button" className="secondary-btn compact-btn" onClick={() => handleUserRestore(adminUser)}>Reativar</button>
                    ) : (
                      <button type="button" className="danger-btn compact-btn" onClick={() => handleUserSuspend(adminUser)}>Ocultar perfil</button>
                    )}
                  </div>
                ))}
                {!isLoadingModeration && !filteredAdminUsers.length && <p className="admin-empty-state">Nenhum perfil corresponde à busca.</p>}
              </div>
            </div>

            <div className="admin-listing-panel glass-panel">
              <div className="section-header compact">
                <h3>Resenhas <span className="admin-count">{filteredAdminReviews.length}</span></h3>
              </div>
              <div className="listing-filters">
                <select aria-label="Filtrar resenhas por nota" value={moderationReviewRating} onChange={(event) => setModerationReviewRating(event.target.value)}>
                  <option value="all">Todas as notas</option>
                  <option value="8">Nota 8 ou mais</option>
                  <option value="5">Nota 5 ou mais</option>
                </select>
              </div>
              <div className="admin-list-grid">
                {isLoadingModeration && <p className="admin-empty-state">Carregando resenhas…</p>}
                {!isLoadingModeration && filteredAdminReviews.map((review) => (
                  <article key={review.id} className="admin-list-item moderation-review">
                    {review.release_cover ? <img src={review.release_cover} alt="" /> : <div className="moderation-avatar">♪</div>}
                    <div className="admin-list-copy">
                      <strong>{review.release_title} · {review.artist_name}</strong>
                      <small>{review.full_name || review.username} · nota {review.rating}/10</small>
                      <p>{review.review_text || 'Resenha sem texto'}</p>
                      {review.gif_url && <img className="moderation-review-gif" src={review.gif_url} alt="GIF anexado à resenha" />}
                    </div>
                    <button type="button" className="danger-btn compact-btn" onClick={() => handleAdminReviewDelete(review)}>Remover resenha</button>
                  </article>
                ))}
                {!isLoadingModeration && !filteredAdminReviews.length && <p className="admin-empty-state">Nenhuma resenha corresponde à busca.</p>}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function RatingBadge({ value }) {
  const color = value >= 8 ? 'green' : value >= 6 ? 'orange' : 'red';
  return <span className={`rating-badge ${color}`}>{value || 0}</span>;
}
