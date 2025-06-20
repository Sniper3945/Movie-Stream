export interface Film {
  id: string;
  title: string;
  cover: string;
  duration: string;
  description: string;
}

export const films: Film[] = [
  {
    id: "film1",
    title: "Gainsbourg vie héroïque",
    cover: "/assets/film1.png",
    duration: "1h 45min",
    description: "La vie de Serge Gainsbourg",
  },
  {
    id: "film2",
    title: "L'affaire Thomas Crown",
    cover: "/assets/film2.png",
    duration: "2h 10min",
    description: "Apparition de Steve McQueen",
  },
  {
    id: "film3",
    title: "La Piscine 1969",
    cover: "/assets/film3.png",
    duration: "1h 30min",
    description: "Alain Delon et Romy Schneider dans un drame psychologique",
  },
];

export const getFilmById = (id: string): Film | undefined => {
  return films.find((film) => film.id === id);
};
