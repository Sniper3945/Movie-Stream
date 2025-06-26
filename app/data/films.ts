// NOTE: Ce fichier sera progressivement remplacé par MongoDB
// Gardé temporairement pour la compatibilité pendant la migration

export interface Film {
  id: string;
  title: string;
  cover: string;
  duration: string;
  description: string;
  year?: number;
  genre?: string[];
  videoUrl?: string; 
  director?: string;// Add this property for compatibility
  ephemere?: boolean; // Ajout pour supporter les films éphémères
}

export const films: Film[] = [
  {
    id: "film1",
    title: "Gainsbourg vie héroïque",
    cover: "/assets/film1.png",
    duration: "2h 08min",
    description: "Biopic musical de Joann Sfar sur la vie tumultueuse de Serge Gainsbourg, de ses débuts jusqu'à sa renommée internationale. Un portrait intime et surréaliste du provocateur français.",
    year: 2010,
    genre: ["Biopic", "Drame"],
    videoUrl: "https://0x0.st/8IpD.mp4",
    director: "Joann Sfar"
  },
  {
    id: "film2",
    title: "L'affaire Thomas Crown",
    cover: "/assets/film2.png",
    duration: "1h 42min",
    description: "Steve McQueen incarne un millionnaire qui braque des banques par ennui. Faye Dunaway est l'enquêtrice chargée de l'arrêter dans ce thriller élégant des années 60.",
    year: 1968,
    genre: ["Thriller", "Romance"],
    videoUrl: "https://0x0.st/8Ipf.mp4",
    director: "Norman Jewison"
  },
  {
    id: "film3",
    title: "La Piscine",
    cover: "/assets/film3.png",
    duration: "2h 02min",
    description: "Alain Delon et Romy Schneider dans un drame psychologique tendu. Vacances d'été qui tournent au cauchemar quand des amis perturbent l'harmonie d'un couple.",
    year: 1969,
    genre: ["Drame", "Thriller"],
    videoUrl: "https://0x0.st/8IpQ.mp4",
    director: "Jacques Deray"
  },
  {
    id: "film4",
    title: "Un Homme et Une Femme",
    cover: "/assets/film4.png",
    duration: "1h 38min",
    description: "Chef-d'œuvre romantique de Claude Lelouch. L'histoire d'amour entre un pilote automobile et une script-girl, tous deux veufs, qui se rencontrent à Deauville.",
    year: 1966,
    genre: ["Romance", "Drame"],
    videoUrl: "https://0x0.st/8IJ8.mp4",
    director: "Claude Lelouch"
  },
  {
    id: "film5",
    title: "Le Samouraï",
    cover: "/assets/film5.png",
    duration: "1h 45min",
    description: "Alain Delon incarne Jef Costello, tueur à gages solitaire et méticuleux. Chef-d'œuvre de Jean-Pierre Melville qui influence encore le cinéma moderne.",
    year: 1967,
    genre: ["Thriller", "Policier"],
    videoUrl: "https://0x0.st/8IId.mp4",
    director: "Jean-Pierre Melville"
  },
  {
    id: "film6",
    title: "Le Clan des Siciliens",
    cover: "/assets/film6.png",
    duration: "2h 04min",
    description: "Alain Delon, Jean Gabin et Lino Ventura dans un polar haletant. L'histoire d'un braquage d'bijouterie orchestré par la mafia sicilienne à Paris.",
    year: 1969,
    genre: ["Policier", "Thriller"],
    videoUrl: "https://0x0.st/8IvB.mp4",
    director: "Henri Verneuil"
  },
  {
    id: "film7",
    title: "Orange mécanique vf",
    cover: "/assets/film7.png",
    duration: "2h 16min",
    description: "Dystopie culte de Stanley Kubrick. Dans un futur proche, Alex DeLarge et ses droogs sèment la terreur avant qu'Alex ne subisse un traitement controversé.",
    year: 1971,
    genre: ["Sci-Fi", "Drame"],
    videoUrl: "https://0x0.st/8ICS.mp4",
    director: "Stanley Kubrick"
  },
  {
    id: "film8",
    title: "Les Dents de la mer vf",
    cover: "/assets/film8.png",
    duration: "2h 04min",
    description: "Premier blockbuster de Steven Spielberg. Un requin géant terrorise une station balnéaire américaine. Suspense aquatique qui a marqué l'histoire du cinéma.",
    year: 1975,
    genre: ["Thriller", "Horreur"],
    videoUrl: "https://0x0.st/8ICg.mp4",
    director: "Steven Spielberg"
  },
  {
    id: "film9",
    title: "Taxi Driver vf",
    cover: "/assets/film9.png",
    duration: "1h 54min",
    description: "Robert De Niro incarne Travis Bickle, chauffeur de taxi new-yorkais sombrant dans la paranoïa. Chef-d'œuvre sombre de Martin Scorsese sur l'aliénation urbaine.",
    year: 1976,
    genre: ["Drame", "Thriller"],
    videoUrl: "https://0x0.st/8IC1.mp4",
    director: "Martin Scorsese"
  },
  {
    id: "film10",
    title: "The Usual Suspects vf",
    cover: "/assets/film10.png",
    duration: "1h 40min",
    description: "Thriller labyrinthique de Bryan Singer. Cinq criminels se retrouvent dans un coup monté par le mystérieux Keyser Söze. Twist final légendaire garanti.",
    year: 1995,
    genre: ["Thriller", "Policier"],
    videoUrl: "https://0x0.st/8Iv1.mp4",
    director: "Bryan Singer"
  },
  {
    id: "film11",
    title: "Apocalypse Now",
    cover: "/assets/film11.png",
    duration: "3h 02min",
    description: "Chef-d'œuvre de Francis Ford Coppola sur la guerre du Vietnam.",
    year: 1979,
    genre: ["Drame", "Guerre"],
    videoUrl: "https://0x0.st/8lrT.mp4",
    director: "Francis Ford Coppola"
  },
  {
    id: "film12",
    title: "8½",
    cover: "/assets/film12.png",
    duration: "2h 18min",
    description: "Fellini explore la crise créative d'un réalisateur.",
    year: 1963,
    genre: ["Drame", "Comédie"],
    videoUrl: "https://0x0.st/8lzm.mp4",
    director: "Federico Fellini"
  },
];

export const getFilmById = (id: string): Film | undefined => {
  return films.find((film) => film.id === id);
};

export const getFilmsByGenre = (genre: string): Film[] => {
  return films.filter((film) => film.genre?.includes(genre));
};

export const getRecentFilms = (count: number = 6): Film[] => {
  return films
    .sort((a, b) => (b.year || 0) - (a.year || 0))
    .slice(0, count);
};
