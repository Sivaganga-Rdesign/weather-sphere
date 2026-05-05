import WeatherCanvas from "./WeatherCanvas";
import { WeatherCondition } from "../services/weatherService";

interface Props {
  condition: WeatherCondition;
}

export default function Background3D({ condition }: Props) {
  return <WeatherCanvas condition={condition} />;
}
