import { AxiosError } from "axios";

export interface ITo {
  quotecurrency: string;
  mid: number;
}

export interface IRatesResponse {
  amount: number;
  to: ITo[];
  from: string;
  timestamp: Date;
}

export interface IRate {
  from: string;
  to: string;
  timestamp: Date;
  rate: number;
}

export interface IXEClientRatesResult {
  requestsRemaining: number;
  rates: IRate[];
}

export interface ICCY {
  ccy: string;
  label: string;
}

export class XERequestError implements Error {
  name: string;
  message: string;

  private query: Record<string, string | Date | number>;
  private path: string;
  private xeResponse: AxiosError;

  constructor(
    query: Record<string, string | Date | number>,
    path: string,
    xeResponse: AxiosError
  ) {
    this.message = `Error occurred fetching rates from XE /${path} with params ${JSON.stringify(
      query
    )}`;
    this.name = this.constructor.name;
    this.query = query;
    this.path = path;
    this.xeResponse = xeResponse;
  }
}

export class InvalidCCYError implements Error {
  name: string;
  message: string;

  constructor(ccy: string) {
    this.message = `${ccy} is not a valid currency`;
    this.name = this.constructor.name;
  }
}
