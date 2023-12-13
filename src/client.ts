import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  InvalidCCYError,
  IRate,
  IRatesResponse,
  IXEClientRatesResult,
  XERequestError,
} from "./types";
import { isValidCCY } from "./currencyCode";

export interface IXEClient {
  getRateForDate: (
    fromCurrency: string,
    toCurrencies: string[],
    currencyDate: Date
  ) => Promise<IXEClientRatesResult>;
}

export const xeClient = (xeApiId: string, xeApiKey: string): IXEClient => {
  const options: AxiosRequestConfig = {
    auth: {
      username: xeApiId,
      password: xeApiKey,
    },
    baseURL: "https://xecdapi.xe.com/v1/",
  };

  const getRateForDate = async (
    fromCurrency: string,
    toCurrencies: string[],
    currencyDate: Date
  ): Promise<IXEClientRatesResult> => {
    if (!isValidCCY(fromCurrency)) {
      return Promise.reject(new InvalidCCYError(fromCurrency));
    }

    const invalidCCYs = toCurrencies.filter((ccy) => !isValidCCY(ccy));

    if (invalidCCYs.length > 0) {
      return Promise.reject(new InvalidCCYError(invalidCCYs.join(",")));
    }

    const path = "historic_rate";
    const toParam = toCurrencies.join(",");

    const query: Record<string, string | Date | number> = {
      from: fromCurrency,
      to: toParam,
      amount: 1,
    };

    query.date = currencyDate.toISOString().split("T")[0];

    try {
      const response: AxiosResponse<IRatesResponse> =
        await handleXERequest<IRatesResponse>(path, query);
      let requestsRemaining = 0;
      if (response.headers) {
        requestsRemaining = response.headers["x-raterequest-remaining"];
      }

      const rates = response.data.to.map((t) => {
        return {
          from: response.data.from,
          to: t.quotecurrency,
          timestamp: response.data.timestamp,
          rate: t.mid,
        } as IRate;
      });

      return {
        rates,
        requestsRemaining,
      };
    } catch (e) {
      console.error(e);
      throw new XERequestError(query, path, e);
    }
  };

  const handleXERequest = async <T>(
    path: string,
    query: Record<string, string | Date | number>
  ) => {
    console.debug(
      `Performing request to XE ${path} endpoint with query params: ${JSON.stringify(
        query
      )}`
    );

    const response: AxiosResponse<T> = await axios.get(path, {
      params: query,
      ...options,
    });

    console.debug(
      `Request complete with status: ${response.status}|${response.statusText}`
    );
    console.debug(`Response data: ${JSON.stringify(response.data)}`);

    return response;
  };

  return {
    getRateForDate,
  };
};
