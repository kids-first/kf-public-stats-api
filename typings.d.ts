declare module '*.json' {
  const data: string;
  export default data;
}

interface Error {
  status?: number;
}

interface PropertyCounts {
  [key: string]: number;
}

declare namespace Express {
  export interface Response {
    __send?(body: any): Send;
    __end?(
      chunk?: any | Function,
      encoding?: string | Function,
      cb?: Function,
    ): void;
  }
  export interface Request {
    jwt?: any;
  }
}
