import type { ApiResponseParser } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/client";
import { parseCollection } from "@/lib/api/parsers";

export type ApiResourceResult<TData> = {
  data: TData;
  errorMessage: string | null;
};

type LoadApiResourceOptions<TData> = {
  fallbackData: TData;
  errorMessage?: string;
};

type CreateResourceParserOptions<TRaw> = {
  parse: (value: unknown) => TRaw;
};

type CreateMappedResourceParserOptions<TRaw, TParsed> = {
  parse: (value: unknown) => TRaw;
  map: (value: TRaw) => TParsed;
};

type CreateCollectionParserOptions<TRaw> = {
  label: string;
  parseItem: (value: unknown, index: number) => TRaw;
};

type CreateMappedCollectionParserOptions<TRaw, TParsed> = {
  label: string;
  parseItem: (value: unknown, index: number) => TRaw;
  mapItem: (value: TRaw, index: number) => TParsed;
};

export async function loadApiResource<TData>(
  load: () => Promise<TData>,
  options: LoadApiResourceOptions<TData>,
): Promise<ApiResourceResult<TData>> {
  try {
    return {
      data: await load(),
      errorMessage: null,
    };
  } catch (error) {
    return {
      data: options.fallbackData,
      errorMessage: getApiErrorMessage(error, options.errorMessage),
    };
  }
}

export function createResourceParser<TRaw>(
  options: CreateResourceParserOptions<TRaw>,
): ApiResponseParser<TRaw>;
export function createResourceParser<TRaw, TParsed>(
  options: CreateMappedResourceParserOptions<TRaw, TParsed>,
): ApiResponseParser<TParsed>;
export function createResourceParser<TRaw, TParsed>(
  options:
    | CreateResourceParserOptions<TRaw>
    | CreateMappedResourceParserOptions<TRaw, TParsed>,
): ApiResponseParser<TRaw | TParsed> {
  return (response) => {
    const parsed = options.parse(response);

    if (!("map" in options)) {
      return parsed;
    }

    return options.map(parsed);
  };
}

export function createCollectionParser<TRaw>(
  options: CreateCollectionParserOptions<TRaw>,
): ApiResponseParser<TRaw[]>;
export function createCollectionParser<TRaw, TParsed>(
  options: CreateMappedCollectionParserOptions<TRaw, TParsed>,
): ApiResponseParser<TParsed[]>;
export function createCollectionParser<TRaw, TParsed>(
  options:
    | CreateCollectionParserOptions<TRaw>
    | CreateMappedCollectionParserOptions<TRaw, TParsed>,
): ApiResponseParser<Array<TRaw | TParsed>> {
  return (response) => {
    return parseCollection(
      response,
      (item, index) => {
        const parsedItem = options.parseItem(item, index);

        if (!("mapItem" in options)) {
          return parsedItem;
        }

        return options.mapItem(parsedItem, index);
      },
      options.label,
    );
  };
}
