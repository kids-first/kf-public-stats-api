declare module '*.json' {
  const data: string;
  export default data;
}

interface Error {
  status?: number;
}
