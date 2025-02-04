#!/usr/bin/env bash

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --model-id) MODEL_ID="$2" ;;
        --system-message) SYSTEM_MESSAGE="$2" ;;
        --conversation-id) CONVERSATION_ID="$2" ;;
        --wrap) WRAP="$2" ;;
        *) echo "$1 is not supported" && exit 1 ;;
    esac
    shift
done

if [ -z "$MODEL_ID" ]; then
    MODEL_ID='DeepSeek-R1-Distilled-NPU-Optimized'
fi

args=()
if [ -n "$SYSTEM_MESSAGE" ]; then
    args+=("--system-message" "$SYSTEM_MESSAGE")
fi
if [ -n "$CONVERSATION_ID" ]; then
    args+=("--conversation-id" "$(date +%Y%m%d-%H%M%S)")
fi
if [ -n "$WRAP" ]; then
    args+=("--wrap" "$WRAP")
fi

clear -x

while true; do
    echo "[User] (Type 'exit' to quit)"
    echo
    read prompt
    if [ -z "$prompt" ]; then
        continue
    fi
    if [ "$prompt" = 'exit' ]; then
        echo
        break
    fi
    echo
    echo
    echo "[Assistant]"
    echo
    ./node_modules/.bin/tsx ./src/main.ts --model-id "$MODEL_ID" --prompt "$prompt" "${args[@]}" | cat
    echo
done
