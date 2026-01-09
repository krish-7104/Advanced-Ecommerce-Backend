import { listOfStateCities } from "../../../utils/list-of-state-cities";
import ApiError from "../../../utils/ApiError";

export const getAllStatesService = () => {
  try {
    const states = Object.keys(listOfStateCities);
    return states.sort();
  } catch (error: any) {
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getCitiesByStateService = (stateName: string) => {
  try {
    if (!stateName) {
      throw new ApiError(400, "State name is required");
    }

    const stateKey = Object.keys(listOfStateCities).find(
      (key) => key.toLowerCase() === stateName.toLowerCase()
    );

    if (!stateKey) {
      throw new ApiError(404, "State not found");
    }

    const cities = listOfStateCities[stateKey as keyof typeof listOfStateCities];
    return {
      state: stateKey,
      cities: cities.sort(),
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getAllStatesCitiesService = () => {
  try {
    const result: Record<string, string[]> = {};
    
    Object.keys(listOfStateCities).forEach((state) => {
      const cities = listOfStateCities[state as keyof typeof listOfStateCities];
      result[state] = [...cities].sort();
    });

    return result;
  } catch (error: any) {
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

