# 12-07 Voice Preview & Agent Voice Selection

Version: v1.7.2

## Purpose

Voice management must not only store provider configuration such as ElevenLabs `voiceId`. Studio administrators also need a safe way to preview the voice before assigning it to an Agent.

v1.7.2 introduces the formal **Voice Profile Preview Audio** model.

## Core decision

Use `previewAudioUrl`, not `voice_url`.

Reason:

- `voice_url` sounds like a provider API URL or a real ElevenLabs voice endpoint.
- `previewAudioUrl` clearly means platform-owned sample audio for preview.
- Agent should not duplicate this field.

## Ownership rule

```text
VoiceProfile.previewAudioUrl = sample audio owner
Agent.manifest.voice.profileId = reference only
Agent edit page = resolve selected VoiceProfile.previewAudioUrl for playback
```

Agent may receive expanded display fields in API response for frontend convenience, but database ownership remains in Voice Profile.

## Voice Profile pages

Routes:

```text
/voice-profiles
/voice-profiles/new
/voice-profiles/:id/edit
```

Voice list page supports:

- View display name, provider, language and status
- Inline preview audio player
- Edit
- Mock test
- Publish
- Set default

Voice edit page supports:

- Basic voice metadata
- Provider configuration
- ElevenLabs placeholder fields
- Preview Audio URL field
- Local audio preview upload

## Local preview upload rule

The local audio selector is for browser preview only.

```text
Browser File → URL.createObjectURL(file) → <audio controls />
```

It does not:

- upload to UTM Ubuntu
- call backend upload API
- write to database
- persist after refresh

Future reserved endpoint:

```http
POST /studio/voice-profiles/:id/preview-audio
```

v1.7.2 returns a reserved/mock response only.

## Agent edit integration

Agent edit page now filters Voice Profiles to published/active voices.

When a Voice Profile is selected:

- show voice name
- show provider/status tags
- show preview audio player

Saving Agent still stores only:

```json
{
  "voice": {
    "profileId": "voice_profile_jarvis_default"
  }
}
```

For sandbox frontend convenience, the mock payload may also return:

```json
{
  "voice": {
    "profileId": "voice_profile_jarvis_default",
    "displayName": "Jarvis Default Voice",
    "previewAudioUrl": "data:audio/wav;base64,..."
  }
}
```

This is response expansion, not ownership transfer.
