/**
 * @file AISettings.tsx
 * @description AI settings component for configuring OpenRouter integration
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 1.0.0
 * @since 2025-12-25
 */

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { toast } from "sonner-native";
import { useSettings } from "@/utils/atoms/settings";
import { OpenRouterService } from "@/utils/openrouter/OpenRouterService";
import { Button } from "../Button";
import { Input } from "../common/Input";
import { Text } from "../common/Text";
import { ListGroup } from "../list/ListGroup";
import { ListItem } from "../list/ListItem";

export const AISettings = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();

  const [apiKey, setApiKey] = useState<string>(
    settings?.openRouterApiKey ?? "",
  );
  const [model, setModel] = useState<string>(
    settings?.openRouterModel ?? "google/gemini-2.0-flash-001",
  );

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      if (!apiKey) {
        throw new Error("API key is required");
      }
      const service = new OpenRouterService({
        apiKey,
        model,
      });
      const isValid = await service.testConnection();
      if (!isValid) {
        throw new Error("Connection failed");
      }
      return true;
    },
    onSuccess: () => {
      toast.success(t("home.settings.plugins.ai.connection_success"));
      updateSettings({
        openRouterApiKey: apiKey,
        openRouterModel: model,
        enableAIChat: true,
      });
    },
    onError: () => {
      toast.error(t("home.settings.plugins.ai.connection_failed"));
    },
  });

  const clearConfig = () => {
    setApiKey("");
    setModel("google/gemini-2.0-flash-001");
    updateSettings({
      openRouterApiKey: undefined,
      openRouterModel: "google/gemini-2.0-flash-001",
      enableAIChat: false,
    });
    toast.success(t("home.settings.plugins.ai.config_cleared"));
  };

  const saveSettings = () => {
    updateSettings({
      openRouterApiKey: apiKey,
      openRouterModel: model,
    });
    toast.success(t("home.settings.plugins.ai.settings_saved"));
  };

  const isConfigured = Boolean(settings?.openRouterApiKey);

  return (
    <View>
      {isConfigured ? (
        <>
          <ListGroup title={t("home.settings.plugins.ai.title")}>
            <ListItem
              title={t("home.settings.plugins.ai.status")}
              value={
                settings?.enableAIChat
                  ? t("home.settings.plugins.ai.enabled")
                  : t("home.settings.plugins.ai.disabled")
              }
            />
            <ListItem
              title={t("home.settings.plugins.ai.model")}
              value={settings?.openRouterModel}
            />
          </ListGroup>

          <ListGroup
            title={t("home.settings.plugins.ai.retention.title")}
            className='mt-4'
          >
            <ListItem
              title={t("home.settings.plugins.ai.retention.no_retention")}
              onPress={() => updateSettings({ chatRetentionDays: 0 })}
              value={settings?.chatRetentionDays === 0 ? "✓" : undefined}
            />
            <ListItem
              title={t("home.settings.plugins.ai.retention.seven_days")}
              onPress={() => updateSettings({ chatRetentionDays: 7 })}
              value={settings?.chatRetentionDays === 7 ? "✓" : undefined}
            />
            <ListItem
              title={t("home.settings.plugins.ai.retention.fifteen_days")}
              onPress={() => updateSettings({ chatRetentionDays: 15 })}
              value={settings?.chatRetentionDays === 15 ? "✓" : undefined}
            />
            <ListItem
              title={t("home.settings.plugins.ai.retention.thirty_days")}
              onPress={() => updateSettings({ chatRetentionDays: 30 })}
              value={settings?.chatRetentionDays === 30 ? "✓" : undefined}
            />
          </ListGroup>

          <View className='flex flex-col rounded-xl overflow-hidden p-4 bg-neutral-900 mt-4'>
            <Text className='font-bold mb-1'>
              {t("home.settings.plugins.ai.model")}
            </Text>
            <Text className='text-xs text-gray-600 mb-2'>
              {t("home.settings.plugins.ai.model_hint")}
            </Text>
            <Input
              className='border border-neutral-800 mb-4'
              placeholder='google/gemini-2.0-flash-001'
              value={model}
              defaultValue={settings?.openRouterModel}
              keyboardType='default'
              returnKeyType='done'
              autoCapitalize='none'
              onChangeText={setModel}
            />

            <Button color='purple' className='h-12 mb-2' onPress={saveSettings}>
              {t("home.settings.plugins.ai.save_button")}
            </Button>

            <Button color='red' onPress={clearConfig}>
              {t("home.settings.plugins.ai.reset_config_button")}
            </Button>
          </View>
        </>
      ) : (
        <View className='flex flex-col rounded-xl overflow-hidden p-4 bg-neutral-900'>
          <Text className='text-xs text-purple-400 mb-2'>
            {t("home.settings.plugins.ai.ai_info")}
          </Text>

          <Text className='font-bold mb-1'>
            {t("home.settings.plugins.ai.api_key")}
          </Text>
          <Text className='text-xs text-gray-600 mb-2'>
            {t("home.settings.plugins.ai.api_key_hint")}
          </Text>
          <Input
            className='border border-neutral-800 mb-4'
            placeholder={t("home.settings.plugins.ai.api_key_placeholder")}
            value={apiKey}
            keyboardType='default'
            secureTextEntry={true}
            returnKeyType='done'
            autoCapitalize='none'
            textContentType='password'
            onChangeText={setApiKey}
            editable={!testConnectionMutation.isPending}
          />

          <Text className='font-bold mb-1'>
            {t("home.settings.plugins.ai.model")}
          </Text>
          <Text className='text-xs text-gray-600 mb-2'>
            {t("home.settings.plugins.ai.model_hint")}
          </Text>
          <Input
            className='border border-neutral-800 mb-4'
            placeholder='google/gemini-2.0-flash-001'
            value={model}
            keyboardType='default'
            returnKeyType='done'
            autoCapitalize='none'
            onChangeText={setModel}
            editable={!testConnectionMutation.isPending}
          />

          <Button
            loading={testConnectionMutation.isPending}
            disabled={testConnectionMutation.isPending || !apiKey}
            color='purple'
            className='h-12'
            onPress={() => testConnectionMutation.mutate()}
          >
            {t("home.settings.plugins.ai.test_and_save_button")}
          </Button>
        </View>
      )}
    </View>
  );
};
