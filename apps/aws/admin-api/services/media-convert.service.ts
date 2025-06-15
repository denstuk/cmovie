import {
	MediaConvertClient,
	CreateJobCommand,
} from "@aws-sdk/client-mediaconvert";

type ConvertMediaParams = {
	tempKey: string;
	tempBucket: string;
	destKey: string;
	destBucket: string;
	roleArn: string;
};

const mediaConvertClient = new MediaConvertClient({ region: "us-east-1" });
export function convertMedia({
	tempKey,
	destKey,
	tempBucket,
	destBucket,
	roleArn,
}: ConvertMediaParams) {
	const command = new CreateJobCommand({
		Role: roleArn,
		Settings: {
			OutputGroups: [
				{
					Name: "HLS Group",
					OutputGroupSettings: {
						Type: "HLS_GROUP_SETTINGS",
						HlsGroupSettings: {
							SegmentLength: 10,
							Destination: `s3://${destBucket}/${destKey}/`,
							MinSegmentLength: 0,
						},
					},
					Outputs: [
						{
							NameModifier: "_hls_720p",
							ContainerSettings: {
								Container: "M3U8",
							},
							VideoDescription: {
								CodecSettings: {
									Codec: "H_264",
									H264Settings: {
										RateControlMode: "QVBR",
										SceneChangeDetect: "TRANSITION_DETECTION",
										MaxBitrate: 5000000,
									},
								},
							},
							AudioDescriptions: [
								{
									CodecSettings: {
										Codec: "AAC",
										AacSettings: {
											Bitrate: 96000,
											CodingMode: "CODING_MODE_2_0",
											SampleRate: 48000,
										},
									},
								},
							],
						},
					],
				},
			],
			Inputs: [
				{
					FileInput: `s3://${tempBucket}/${tempKey}`,
					VideoSelector: {},
					AudioSelectors: {
						"Audio Selector 1": {
							DefaultSelection: "DEFAULT",
						},
					},
				},
			],
		},
		UserMetadata: {
			originalFile: tempKey,
		},
	});
	return mediaConvertClient.send(command);
}
