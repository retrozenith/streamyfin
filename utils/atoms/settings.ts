import {
  type BaseItemKind,
  type CultureDto,
  type ItemFilter,
  type ItemSortBy,
  type SortOrder,
  SubtitlePlaybackMode,
} from "@jellyfin/sdk/lib/generated-client";
import { atom, useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { BITRATES, type Bitrate } from "@/components/BitrateSelector";
import * as ScreenOrientation from "@/packages/expo-screen-orientation";
import { apiAtom } from "@/providers/JellyfinProvider";
import { writeInfoLog } from "@/utils/log";
import { storage } from "../mmkv";

const _STREAMYFIN_PLUGIN_ID = "1e9e5d386e6746158719e98a5c34f004";
const STREAMYFIN_PLUGIN_SETTINGS = "STREAMYFIN_PLUGIN_SETTINGS";

export type DownloadQuality = "original" | "high" | "low";

export type DownloadOption = {
  label: string;
  value: DownloadQuality;
};

export const ScreenOrientationEnum: Record<
  (typeof ScreenOrientation.OrientationLock)[keyof typeof ScreenOrientation.OrientationLock],
  string
> = {
  [ScreenOrientation.OrientationLock.DEFAULT]:
    "home.settings.other.orientations.DEFAULT",
  [ScreenOrientation.OrientationLock.ALL]:
    "home.settings.other.orientations.ALL",
  [ScreenOrientation.OrientationLock.PORTRAIT]:
    "home.settings.other.orientations.PORTRAIT",
  [ScreenOrientation.OrientationLock.PORTRAIT_UP]:
    "home.settings.other.orientations.PORTRAIT_UP",
  [ScreenOrientation.OrientationLock.PORTRAIT_DOWN]:
    "home.settings.other.orientations.PORTRAIT_DOWN",
  [ScreenOrientation.OrientationLock.LANDSCAPE]:
    "home.settings.other.orientations.LANDSCAPE",
  [ScreenOrientation.OrientationLock.LANDSCAPE_LEFT]:
    "home.settings.other.orientations.LANDSCAPE_LEFT",
  [ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT]:
    "home.settings.other.orientations.LANDSCAPE_RIGHT",
  [ScreenOrientation.OrientationLock.OTHER]:
    "home.settings.other.orientations.OTHER",
  [ScreenOrientation.OrientationLock.UNKNOWN]:
    "home.settings.other.orientations.UNKNOWN",
};

export const DownloadOptions: DownloadOption[] = [
  {
    label: "Original quality",
    value: "original",
  },
  {
    label: "High quality",
    value: "high",
  },
  {
    label: "Small file size",
    value: "low",
  },
];

export type LibraryOptions = {
  display: "row" | "list";
  cardStyle: "compact" | "detailed";
  imageStyle: "poster" | "cover";
  showTitles: boolean;
  showStats: boolean;
};

export type DefaultLanguageOption = {
  value: string;
  label: string;
};

export type Home = {
  sections: Array<HomeSection>;
};

export type HomeSection = {
  title?: string;
  orientation?: "horizontal" | "vertical";
  items?: HomeSectionItemResolver;
  nextUp?: HomeSectionNextUpResolver;
  latest?: HomeSectionLatestResolver;
  custom?: HomeSectionCustomEndpointResolver;
};

export type HomeSectionItemResolver = {
  title?: string;
  sortBy?: Array<ItemSortBy>;
  sortOrder?: Array<SortOrder>;
  includeItemTypes?: Array<BaseItemKind>;
  genres?: Array<string>;
  parentId?: string;
  limit?: number;
  filters?: Array<ItemFilter>;
};

export type HomeSectionCustomEndpointResolver = {
  title?: string;
  endpoint: string;
  headers?: any;
  query?: any;
};

export type HomeSectionNextUpResolver = {
  parentId?: string;
  limit?: number;
  enableResumable?: boolean;
  enableRewatching?: boolean;
};

export interface MaxAutoPlayEpisodeCount {
  key: string;
  value: number;
}

export type HomeSectionLatestResolver = {
  parentId?: string;
  limit?: number;
  groupItems?: boolean;
  isPlayed?: boolean;
  includeItemTypes?: Array<BaseItemKind>;
};

export enum VideoPlayer {
  // NATIVE, //todo: changes will make this a lot more easier to implement if we want. delete if not wanted
  VLC_3 = 0,
  VLC_4 = 1,
}

export type Settings = {
  home?: Home | null;
  deviceProfile?: "Expo" | "Native" | "Old";
  mediaListCollectionIds?: string[];
  preferedLanguage?: string;
  searchEngine: "Marlin" | "Jellyfin";
  marlinServerUrl?: string;
  openInVLC?: boolean;
  downloadQuality?: DownloadOption;
  defaultBitrate?: Bitrate;
  libraryOptions: LibraryOptions;
  defaultAudioLanguage: CultureDto | null;
  playDefaultAudioTrack: boolean;
  rememberAudioSelections: boolean;
  defaultSubtitleLanguage: CultureDto | null;
  subtitleMode: SubtitlePlaybackMode;
  rememberSubtitleSelections: boolean;
  showHomeTitles: boolean;
  defaultVideoOrientation: (typeof ScreenOrientation.OrientationLock)[keyof typeof ScreenOrientation.OrientationLock];
  forwardSkipTime: number;
  rewindSkipTime: number;
  showCustomMenuLinks: boolean;
  disableHapticFeedback: boolean;
  subtitleSize: number;
  safeAreaInControlsEnabled: boolean;
  jellyseerrServerUrl?: string;
  hiddenLibraries?: string[];
  enableH265ForChromecast: boolean;
  defaultPlayer: VideoPlayer;
  maxAutoPlayEpisodeCount: MaxAutoPlayEpisodeCount;
  autoPlayEpisodeCount: number;
  vlcTextColor?: string;
  vlcBackgroundColor?: string;
  vlcOutlineColor?: string;
  vlcOutlineThickness?: string;
  vlcBackgroundOpacity?: number;
  vlcOutlineOpacity?: number;
  vlcIsBold?: boolean;
  // Gesture controls
  enableHorizontalSwipeSkip: boolean;
  enableLeftSideBrightnessSwipe: boolean;
  enableRightSideVolumeSwipe: boolean;
  usePopularPlugin: boolean;
  showLargeHomeCarousel: boolean;
  // OpenRouter AI
  openRouterApiKey?: string;
  openRouterModel?: string;
  enableAIChat?: boolean;
  aiSystemPrompt?: string;
  chatRetentionDays?: 0 | 7 | 15 | 30; // 0 = no retention
  // AI Tools (MCP)
  enableAITools?: boolean; // Toggle for models that don't support tools
  tmdbApiKey?: string;
  tvdbApiKey?: string;
};

export interface Lockable<T> {
  locked: boolean;
  value: T;
}

export type PluginLockableSettings = {
  [K in keyof Settings]: Lockable<Settings[K]>;
};
export type StreamyfinPluginConfig = {
  settings: PluginLockableSettings;
};

export const defaultValues: Settings = {
  home: null,
  deviceProfile: "Expo",
  mediaListCollectionIds: [],
  preferedLanguage: undefined,
  searchEngine: "Jellyfin",
  marlinServerUrl: "",
  openInVLC: false,
  downloadQuality: DownloadOptions[0],
  defaultBitrate: BITRATES[0],
  libraryOptions: {
    display: "list",
    cardStyle: "detailed",
    imageStyle: "cover",
    showTitles: true,
    showStats: true,
  },
  defaultAudioLanguage: null,
  playDefaultAudioTrack: true,
  rememberAudioSelections: true,
  defaultSubtitleLanguage: null,
  subtitleMode: SubtitlePlaybackMode.Default,
  rememberSubtitleSelections: true,
  showHomeTitles: true,
  defaultVideoOrientation: ScreenOrientation.OrientationLock.DEFAULT,
  forwardSkipTime: 30,
  rewindSkipTime: 10,
  showCustomMenuLinks: false,
  disableHapticFeedback: false,
  subtitleSize: Platform.OS === "ios" ? 60 : 100,
  safeAreaInControlsEnabled: true,
  jellyseerrServerUrl: undefined,
  hiddenLibraries: [],
  enableH265ForChromecast: false,
  defaultPlayer: VideoPlayer.VLC_3, // ios-only setting. does not matter what this is for android
  maxAutoPlayEpisodeCount: { key: "3", value: 3 },
  autoPlayEpisodeCount: 0,
  vlcTextColor: undefined,
  vlcBackgroundColor: undefined,
  vlcOutlineColor: undefined,
  vlcOutlineThickness: undefined,
  vlcBackgroundOpacity: undefined,
  vlcOutlineOpacity: undefined,
  vlcIsBold: undefined,
  // Gesture controls
  enableHorizontalSwipeSkip: true,
  enableLeftSideBrightnessSwipe: true,
  enableRightSideVolumeSwipe: true,
  usePopularPlugin: true,
  showLargeHomeCarousel: false,
  // OpenRouter AI
  openRouterApiKey: undefined,
  openRouterModel: "tngtech/tng-r1t-chimera:free",
  enableAIChat: false,
  aiSystemPrompt: `You are Streamyfin Assistant, a specialized AI assistant for Streamyfin - a Jellyfin media client app. Your purpose is to help users discover, track, organize, and explore movies, TV shows, and entertainment content.

## Your Core Responsibilities

### Content Discovery & Information
- Provide detailed information about movies, TV shows, actors, directors, and crew members
- Explain plot summaries, episode guides, season breakdowns, and content ratings
- Share production details, filming locations, budgets, box office performance, and release dates
- Discuss genres, themes, cinematography, soundtracks, and critical reception
- Help users understand content warnings, age ratings, and parental guidance information

### Personalized Recommendations
- Suggest content based on user preferences, viewing history, and mood
- Recommend similar titles when users enjoy specific movies or shows
- Create curated lists for specific themes, genres, or occasions
- Help users discover hidden gems, cult classics, or trending content
- Suggest viewing orders for franchises, cinematic universes, or anthology series

### Tracking & Organization
- Assist users in managing watchlists, favorites, and viewing history
- Help track progress through TV series and multi-season shows
- Organize content into custom collections and categories

## Your Communication Style

**Be enthusiastic but not pushy**: Share your knowledge with genuine interest while respecting user preferences and tastes.

**Stay spoiler-aware**: Always ask before revealing plot details, twists, or endings. Use clear spoiler warnings when discussing story elements.

**Be inclusive**: Recognize diverse tastes in entertainment. What one person loves, another might not enjoy, and that's perfectly fine.

**Be concise yet thorough**: Provide enough information to be helpful without overwhelming users. Offer to elaborate if they want more details.

## Special Scenarios

**Handling subjective opinions**: When users ask "Is X good?", acknowledge that taste is subjective. Share critical consensus, audience ratings, and specific aspects that appeal to different viewers rather than making absolute judgments.

**Content warnings**: Take seriously requests for content warnings about violence, disturbing themes, or sensitive topics. Provide clear, specific information to help users make informed viewing decisions.

**Franchise complexity**: For complex universes like Marvel, Star Wars, or long-running series, offer viewing order options (chronological, release order, recommended) and explain the benefits of each.

**International content**: Respect and celebrate global cinema and television. Help users discover international films and shows, and explain cultural context when relevant.

Your goal is to enhance every user's entertainment experience by being knowledgeable, helpful, and genuinely passionate about helping them find content they'll love.`,
  chatRetentionDays: 0,
  // AI Tools (MCP)
  enableAITools: false,
  tmdbApiKey: undefined,
  tvdbApiKey: undefined,
};

const loadSettings = (): Partial<Settings> => {
  try {
    const jsonValue = storage.getString("settings");
    const loadedValues: Partial<Settings> =
      jsonValue != null ? JSON.parse(jsonValue) : {};

    return loadedValues;
  } catch (error) {
    console.error("Failed to load settings:", error);
    return {};
  }
};

const EXCLUDE_FROM_SAVE = ["home"];

const saveSettings = (settings: Settings) => {
  try {
    for (const key of Object.keys(settings)) {
      if (EXCLUDE_FROM_SAVE.includes(key)) {
        delete settings[key as keyof Settings];
      }
    }
    const jsonValue = JSON.stringify(settings);
    storage.set("settings", jsonValue);
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
};

export const settingsAtom = atom<Partial<Settings> | null>(null);
const loadPluginSettings = () => {
  try {
    return storage.get<PluginLockableSettings>(STREAMYFIN_PLUGIN_SETTINGS);
  } catch (error) {
    console.error("Failed to load plugin settings:", error);
    return undefined;
  }
};

export const pluginSettingsAtom = atom<PluginLockableSettings | undefined>(
  loadPluginSettings(),
);

export const useSettings = () => {
  const api = useAtomValue(apiAtom);
  const [_settings, setSettings] = useAtom(settingsAtom);
  const [pluginSettings, _setPluginSettings] = useAtom(pluginSettingsAtom);

  useEffect(() => {
    if (_settings === null) {
      const loadedSettings = loadSettings();
      setSettings(loadedSettings);
    }
  }, [_settings, setSettings]);

  const setPluginSettings = useCallback(
    (settings: PluginLockableSettings | undefined) => {
      storage.setAny(STREAMYFIN_PLUGIN_SETTINGS, settings);
      _setPluginSettings(settings);
    },
    [_setPluginSettings],
  );

  const refreshStreamyfinPluginSettings = useCallback(async () => {
    if (!api) {
      return;
    }
    const settings = await api.getStreamyfinPluginConfig().then(
      ({ data }) => {
        writeInfoLog("Got plugin settings", data?.settings);
        return data?.settings;
      },
      (_err) => undefined,
    );
    setPluginSettings(settings);
    return settings;
  }, [api]);

  const updateSettings = (update: Partial<Settings>) => {
    if (!_settings) {
      return;
    }
    const hasChanges = Object.entries(update).some(
      ([key, value]) => _settings[key as keyof Settings] !== value,
    );

    if (hasChanges) {
      // Merge default settings, current settings, and updates to ensure all required properties exist
      const newSettings = {
        ...defaultValues,
        ..._settings,
        ...update,
      } as Settings;
      setSettings(newSettings);
      saveSettings(newSettings);
    }
  };

  // We do not want to save over users pre-existing settings in case admin ever removes/unlocks a setting.
  // If admin sets locked to false but provides a value,
  // use user settings first and fallback on admin setting if required.
  const settings: Settings = useMemo(() => {
    const unlockedPluginDefaults: Partial<Settings> = {};
    const overrideSettings = Object.entries(pluginSettings ?? {}).reduce<
      Partial<Settings>
    >((acc, [key, setting]) => {
      if (setting) {
        const { value, locked } = setting;
        const settingsKey = key as keyof Settings;

        // Make sure we override default settings with plugin settings when they are not locked.
        if (
          !locked &&
          value !== undefined &&
          _settings?.[settingsKey] !== value
        ) {
          (unlockedPluginDefaults as any)[settingsKey] = value;
        }

        (acc as any)[settingsKey] = locked
          ? value
          : (_settings?.[settingsKey] ?? value);
      }
      return acc;
    }, {});

    return {
      ...defaultValues,
      ..._settings,
      ...overrideSettings,
    };
  }, [_settings, pluginSettings]);

  return {
    settings,
    updateSettings,
    pluginSettings,
    setPluginSettings,
    refreshStreamyfinPluginSettings,
  };
};
