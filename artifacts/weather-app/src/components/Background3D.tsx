import WeatherCanvas from "./WeatherCanvas";
import { WeatherCondition } from "../services/weatherService";

interface Props {
  condition: WeatherCondition;
  isDay: boolean;
}

export default function Background3D({ condition, isDay }: Props) {
  return <WeatherCanvas condition={condition} isDay={isDay} />;
}
