# 07-19 Voice Preview & Agent Voice Selection API

Version: v1.7.2

## Voice Profile field update

Formal field:

```json
{
  "previewAudioUrl": "data:audio/wav;base64,..."
}
```

Legacy field `previewUrl` is tolerated during migration but new frontend and documentation use `previewAudioUrl`.

## Studio Voice APIs

```http
GET    /studio/voice-profiles?status=PUBLISHED
POST   /studio/voice-profiles
GET    /studio/voice-profiles/:id
PATCH  /studio/voice-profiles/:id
POST   /studio/voice-profiles/:id/test
POST   /studio/voice-profiles/:id/set-default
POST   /studio/voice-profiles/:id/publish
POST   /studio/voice-profiles/:id/disable
POST   /studio/voice-profiles/:id/preview-audio
```

`preview-audio` is reserved in v1.7.2. Frontend does not call it for local preview files.

## Example Voice Profile

```json
{
  "id": "voice_profile_jarvis_default",
  "provider": "ELEVENLABS",
  "displayName": "Jarvis Default Voice",
  "voiceId": "JBFqnCBsd6RMkjVDRZzb",
  "modelId": "eleven_v3",
  "outputFormat": "mp3_44100_128",
  "language": "zh-CN",
  "previewAudioUrl": "data:audio/wav;base64,...",
  "status": "PUBLISHED",
  "isDefault": true
}
```

## Agent selection rule

Agent edit page should only show Voice Profiles whose status is:

```text
PUBLISHED or ACTIVE
```

Agent persistence remains:

```json
{
  "manifest": {
    "voice": {
      "profileId": "voice_profile_jarvis_default"
    }
  }
}
```
