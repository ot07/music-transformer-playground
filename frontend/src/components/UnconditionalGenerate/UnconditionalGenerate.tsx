import { Button, Center, Group, Loader, rem } from "@mantine/core";
import { PianoRoll, useRecital } from "@resonance-box/react-recital";
import {
  IconPlayerPlayFilled,
  IconPlayerStopFilled,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { type FC, useLayoutEffect, useMemo, useState } from "react";
import {
  createSongFromMidiArrayBuffer,
  type Song,
} from "@resonance-box/recital-core";
import { getMinMaxNoteNumber } from "../../utils/getMinMaxNoteNumber";

async function getGeneratedSong(apiUrl: string): Promise<Song> {
  const response = await fetch(`${apiUrl}/generate/unconditional/from-scratch`);
  const data = await response.arrayBuffer();
  return createSongFromMidiArrayBuffer(data, 480);
}

interface GenerateButtonProps {
  isGenerating: boolean;
  generate: () => void;
}

const GenerateButton: FC<GenerateButtonProps> = ({
  isGenerating,
  generate,
}) => {
  return (
    <Center>
      <Button
        color="dark"
        radius="md"
        fw={700}
        disabled={isGenerating}
        leftIcon={isGenerating ? <Loader color="gray" size="xs" /> : undefined}
        styles={(theme) => ({
          root: {
            height: rem(40),
          },
        })}
        onClick={generate}
      >
        {isGenerating ? "Generating..." : "Generate"}
      </Button>
    </Center>
  );
};

interface PlayerProps {
  song: Song | undefined;
  isGenerating: boolean;
}

const Player: FC<PlayerProps> = ({ song, isGenerating }) => {
  const { play, stop, setSong } = useRecital();

  useLayoutEffect(() => {
    if (song !== undefined) {
      setSong(song);
    }
  }, [song]);

  return (
    <Group position="center">
      <Button
        radius="md"
        fw={700}
        leftIcon={<IconPlayerPlayFilled size="1rem" />}
        disabled={isGenerating}
        styles={(theme) => ({
          root: {
            height: rem(40),
          },
        })}
        onClick={play}
      >
        PLAY
      </Button>
      <Button
        color="red"
        radius="md"
        fw={700}
        leftIcon={<IconPlayerStopFilled size="1rem" />}
        disabled={isGenerating}
        styles={(theme) => ({
          root: {
            height: rem(40),
          },
        })}
        onClick={stop}
      >
        STOP
      </Button>
    </Group>
  );
};

interface UnconditionalGenerateProps {
  apiUrl: string;
}

export const UnconditionalGenerate: FC<UnconditionalGenerateProps> = ({
  apiUrl,
}) => {
  const [isClickedGenerateButton, setIsClickedGenerateButton] = useState(false);
  const {
    data: song,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["generatedSong"],
    queryFn: async () => await getGeneratedSong(apiUrl),
    refetchOnWindowFocus: false,
    enabled: false,
  });

  const { minNoteNumber, maxNoteNumber } = useMemo(() => {
    if (song === undefined) {
      return { minNoteNumber: 0, maxNoteNumber: 127 };
    }

    const { minNoteNumber, maxNoteNumber } = getMinMaxNoteNumber(song);
    return {
      minNoteNumber: Math.max(0, minNoteNumber - 3),
      maxNoteNumber: Math.min(127, maxNoteNumber + 3),
    };
  }, [song]);

  const generate = (): void => {
    refetch().catch((e) => {
      throw new Error(e.message);
    });
    !isClickedGenerateButton && setIsClickedGenerateButton(true);
  };

  return (
    <>
      <GenerateButton isGenerating={isFetching} generate={generate} />
      {isClickedGenerateButton && (
        <>
          <Player isGenerating={isFetching} song={song} />
          <PianoRoll
            height={600}
            minNoteNumber={minNoteNumber}
            maxNoteNumber={maxNoteNumber}
          />
        </>
      )}
    </>
  );
};
