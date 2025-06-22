export interface Film {
  id: string;
  title: string;
  cover: string;
  duration: string;
  description: string;
  year?: number;
  genre?: string[];
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
  },
  {
    id: "film2",
    title: "L'affaire Thomas Crown",
    cover: "/assets/film2.png",
    duration: "1h 42min",
    description: "Steve McQueen incarne un millionnaire qui braque des banques par ennui. Faye Dunaway est l'enquêtrice chargée de l'arrêter dans ce thriller élégant des années 60.",
    year: 1968,
    genre: ["Thriller", "Romance"],
  },
  {
    id: "film3",
    title: "La Piscine",
    cover: "/assets/film3.png",
    duration: "2h 02min",
    description: "Alain Delon et Romy Schneider dans un drame psychologique tendu. Vacances d'été qui tournent au cauchemar quand des amis perturbent l'harmonie d'un couple.",
    year: 1969,
    genre: ["Drame", "Thriller"],
  },
  {
    id: "film4",
    title: "Un Homme et Une Femme",
    cover: "/assets/film4.png",
    duration: "1h 38min",
    description: "Chef-d'œuvre romantique de Claude Lelouch. L'histoire d'amour entre un pilote automobile et une script-girl, tous deux veufs, qui se rencontrent à Deauville.",
    year: 1966,
    genre: ["Romance", "Drame"],
  },
  {
    id: "film5",
    title: "Le Samouraï",
    cover: "/assets/film5.png",
    // cover: "/assets/placeholder.png",
    duration: "2h 05min",
    description: "Alain Delon incarne Jef Costello, tueur à gages solitaire et méticuleux. Chef-d'œuvre de Jean-Pierre Melville qui influence encore le cinéma moderne.",
    year: 1967,
    genre: ["Thriller", "Policier"],
  },
  {
    id: "film6",
    title: "Le Clan des Siciliens",
    // cover: "/assets/placeholder.png",
    cover: "/assets/film6.png",
    duration: "1h 40min",
    description: "Alain Delon, Jean Gabin et Lino Ventura dans un polar haletant. L'histoire d'un braquage d'bijouterie orchestré par la mafia sicilienne à Paris.",
    year: 1969,
    genre: ["Policier", "Thriller"],
  },
  {
    id: "film7",
    title: "Orange mécanique vf",
    cover: "/assets/placeholder.png",
    // cover: "/assets/film7.png",
    duration: "2h 15min",
    description: "Dystopie culte de Stanley Kubrick. Dans un futur proche, Alex DeLarge et ses droogs sèment la terreur avant qu'Alex ne subisse un traitement controversé.",
    year: 1971,
    genre: ["Sci-Fi", "Drame"],
  },
  {
    id: "film8",
    title: "Les Dents de la mer vf",
    cover: "/assets/placeholder.png",
    // cover: "/assets/film8.png",
    duration: "1h 50min",
    description: "Premier blockbuster de Steven Spielberg. Un requin géant terrorise une station balnéaire américaine. Suspense aquatique qui a marqué l'histoire du cinéma.",
    year: 1975,
    genre: ["Thriller", "Horreur"],
  },
  {
    id: "film9",
    title: "Taxi Driver vf",
    cover: "/assets/placeholder.png",
    // cover: "/assets/film9.png",
    duration: "1h 35min",
    description: "Robert De Niro incarne Travis Bickle, chauffeur de taxi new-yorkais sombrant dans la paranoïa. Chef-d'œuvre sombre de Martin Scorsese sur l'aliénation urbaine.",
    year: 1976,
    genre: ["Drame", "Thriller"],
  },
  {
    id: "film10",
    title: "The Usual Suspects vf",
    cover: "/assets/film10.png",
    duration: "1h 35min",
    description: "Thriller labyrinthique de Bryan Singer. Cinq criminels se retrouvent dans un coup monté par le mystérieux Keyser Söze. Twist final légendaire garanti.",
    year: 1995,
    genre: ["Thriller", "Policier"],
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
