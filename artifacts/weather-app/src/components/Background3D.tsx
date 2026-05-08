import WeatherCanvas from "./WeatherCanvas";
import { WeatherCondition } from "../services/weatherService";

interface Props {
  condition: WeatherCondition;
  isDay: boolean;
  temp: number;
}

export default function Background3D({ condition, isDay, temp }: Props) {
  return <WeatherCanvas condition={condition} isDay={isDay} temp={temp} />;
}
