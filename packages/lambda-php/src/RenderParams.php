<?php
namespace Remotion\LambdaPhp;

require_once __DIR__ . '/Version.php';
use stdClass;
use VERSION;

class RenderMediaOnLambdaResponse
{
    public string $type;
    public string $bucketName;
    public string $renderId;
}

class GetRenderProgressResponse
{
    public int $chunks;
    public bool $done;
    public float $overallProgress;
    public string $type;
    public ?string $outputFile;
    public int $lambdasInvoked;
    public int $renderSize;
    public int $currentTime;
    public bool $fatalErrorEncountered;
    public ?int $timeToFinish;
    public ?string $outBucket;
    public ?string $outKey;
    public ?string $bucket;
}

class RenderParams
{

    private $data = null;
    private $bucketName = null;
    private $region = null;
    private $outName = null;
    private $composition = null;
    private $serverUrl = null;
    private $framesPerLambda = null;

    private $codec = 'h264';
    private $version = "";
    private $imageFormat = 'jpeg';
    private $crf = null;
    private $envVariables = [];
    private $quality = null;
    private $maxRetries = 1;
    private $privacy = 'private';
    private $logLevel = 'info';
    private $frameRange = null;
    private $timeoutInMilliseconds = 30000;
    private $chromiumOptions = null;
    private $scale = 1;
    private $everyNthFrame = 1;
    private $numberOfGifLoops = 0;
    private $concurrencyPerLambda = 1;
    private $downloadBehavior = [
        'type' => 'play-in-browser',
    ];
    private $muted = false;
    private $overwrite = false;
    private $audioBitrate = null;
    private $videoBitrate = null;
    private $webhook = null;
    private $forceHeight = null;
    private $forceWidth = null;
    private $offthreadVideoCacheSizeInBytes = null;
    private $audioCodec = null;
    private $rendererFunctionName = null;
    private $proResProfile = null;
    private $pixelFormat = null;
    private $x264Preset = null;

    public function __construct(
        ?array $data = null,
        ?string $composition = 'main',
        string $codec = 'h264',
        ?string $version = null,
        string $imageFormat = 'jpeg',
        ?int $crf = null,
        ?array $envVariables = null,
        ?int $quality = null,
        int $maxRetries = 1,
        string $privacy = 'public',
        string $logLevel = 'info',
        ?string $frameRange = null,
        ?string $outName = null,
        ?int $timeoutInMilliseconds = 30000,
        ?object $chromiumOptions = new stdClass(), 
        ?int $scale = 1, 
        ?int $everyNthFrame = 1, 
        ?int $numberOfGifLoops = 0, 
        ?int $concurrencyPerLambda = 1, 
        ?array $downloadBehavior = null, 
        ?bool $muted = false, 
        ?bool $overwrite = false, 
        ?int $audioBitrate = null, 
        ?int $videoBitrate = null, 
        ?string $webhook = null, 
        ?int $forceHeight = null, 
        ?int $forceWidth = null, 
        ?int $offthreadVideoCacheSizeInBytes = null, 
        ?string $audioCodec = null, 
        ?int $framesPerLambda = null, 
        ?string $rendererFunctionName = null, 
        ?string $proResProfile = null, 
        ?string $pixelFormat = null,
        ?string $x264Preset = null,
        )
    {
        $this->data = $data;
        $this->composition = $composition;
        $this->codec = $codec;
        $this->version = $version;
        $this->imageFormat = $imageFormat;
        $this->crf = $crf;
        $this->envVariables = $envVariables;
        $this->quality = $quality;
        $this->maxRetries = $maxRetries;
        $this->privacy = $privacy;
        $this->logLevel = $logLevel;
        $this->frameRange = $frameRange;
        $this->outName = $outName;
        $this->timeoutInMilliseconds = $timeoutInMilliseconds;
        $this->chromiumOptions = $chromiumOptions;
        $this->scale = $scale;
        $this->everyNthFrame = $everyNthFrame;
        $this->numberOfGifLoops = $numberOfGifLoops;
        $this->concurrencyPerLambda = $concurrencyPerLambda;
        $this->downloadBehavior = $downloadBehavior ?? ['type' => 'play-in-browser'];
        $this->muted = $muted;
        $this->overwrite = $overwrite;
        $this->audioBitrate = $audioBitrate;
        $this->videoBitrate = $videoBitrate;
        $this->webhook = $webhook;
        $this->forceHeight = $forceHeight;
        $this->forceWidth = $forceWidth;
        $this->offthreadVideoCacheSizeInBytes = $offthreadVideoCacheSizeInBytes;
        $this->audioCodec = $audioCodec;
        $this->framesPerLambda = $framesPerLambda;
        $this->rendererFunctionName = $rendererFunctionName;
        $this->proResProfile = $proResProfile;
        $this->pixelFormat = $pixelFormat;
        $this->x264Preset = $x264Preset;
    }

    private array $inputProps = array();
    public function serializeParams()
    {
        $parameters = [
            'rendererFunctionName' => $this->getRendererFunctionName(),
            'framesPerLambda' => $this->getFramesPerLambda(),
            'composition' => $this->getComposition(),
            'serveUrl' => $this->getServeUrl(),
            'inputProps' => $this->getInputProps(),
            'codec' => $this->getCodec(),
            'imageFormat' => $this->getImageFormat(),
            'maxRetries' => $this->getMaxRetries(),
            'privacy' => $this->getPrivacy(),
            'logLevel' => $this->getLogLevel(),
            'frameRange' => $this->getFrameRange(),
            'outName' => $this->getOutName(),
            'timeoutInMilliseconds' => $this->getTimeoutInMilliseconds(),
            'chromiumOptions' => $this->getChromiumOptions() === null ? new stdClass() : $this->getChromiumOptions(),
            'scale' => $this->getScale(),
            'everyNthFrame' => $this->getEveryNthFrame(),
            'numberOfGifLoops' => $this->getNumberOfGifLoops(),
            'concurrencyPerLambda' => $this->getConcurrencyPerLambda(),
            'downloadBehavior' => $this->getDownloadBehavior(),
            'muted' => $this->getMuted(),
            'version' => VERSION,
            'overwrite' => $this->getOverwrite(),
            'audioBitrate' => $this->getAudioBitrate(),
            'videoBitrate' => $this->getVideoBitrate(),
            'webhook' => $this->getWebhook(),
            'forceHeight' => $this->getForceHeight(),
            'forceWidth' => $this->getForceWidth(),
            'offthreadVideoCacheSizeInBytes' => $this->getOffthreadVideoCacheSizeInBytes(),
            'bucketName' => $this->getBucketName(),
            'audioCodec' => $this->getAudioCodec(),
            'x264Preset' => $this->getX264Preset(),
            'type' => 'start'
        ];

        if ($this->getCrf() !== null) {
            $parameters['crf'] = $this->getCrf();
        }

        if ($this->getEnvVariables() !== null) {
            $parameters['envVariables'] = $this->getEnvVariables();
        }

        if ($this->getPixelFormat() !== null) {
            $parameters['pixelFormat'] = $this->getPixelFormat();
        }

        if ($this->getX264Preset() !== null) {
            $parameters['x264Preset'] = $this->getX264Preset();
        }

        if ($this->getProResProfile() !== null) {
            $parameters['proResProfile'] = $this->getProResProfile();
        }

        if ($this->getQuality() !== null) {
            $parameters['quality'] = $this->getQuality();
        }

        return $parameters;
    }

    /**
     * Get the value of inputProps
     */
    public function getInputProps()
    {
        return $this->inputProps;
    }

    /**
     * Set the value of inputProps
     *
     * @return  self
     */
    public function internal_setSerializedInputProps($inputProps)
    {
        $this->inputProps = $inputProps;

        return $this;
    }

    /**
     * Get the value of bucketName
     */
    public function getBucketName()
    {
        return $this->bucketName;
    }

    /**
     * Set the value of bucketName
     *
     * @return  self
     */
    public function setBucketName($bucketName)
    {
        $this->bucketName = $bucketName;

        return $this;
    }

    /**
     * Get the value of audioCodec
     */
    public function getAudioCodec()
    {
        return $this->audioCodec;
    }

    /**
     * Set the value of audioCodec
     *
     * @return  self
     */
    public function setAudioCodec($audioCodec)
    {
        $this->audioCodec = $audioCodec;

        return $this;
    }

    /**
     * Get the value of data
     */
    public function getData()
    {
        return $this->data;
    }

    /**
     * Backwards compatible version of setInputProps()
     * Set the value of data
     *
     * @return  self
     */
    public function setData($data)
    {
        $this->data = $data;

        return $this;
    }

    /**
     * Set the value of inputProps
     * @return
     */
    public function setInputProps($data)
    {
        $this->data = $data;

        return $this;
    }

    /**
     * Get the value of composition
     */
    public function getComposition()
    {
        return $this->composition;
    }

    /**
     * Set the value of composition
     *
     * @return  self
     */
    public function setComposition($composition)
    {
        $this->composition = $composition;

        return $this;
    }

    /**
     * Get the value of codec
     */
    public function getCodec()
    {
        return $this->codec;
    }

    /**
     * Set the value of codec
     *
     * @return  self
     */
    public function setCodec($codec)
    {
        $this->codec = $codec;

        return $this;
    }

    /**
     * Get the value of version
     */
    public function getVersion()
    {
        return $this->version;
    }

    /**
     * Set the value of version
     *
     * @return  self
     */
    public function setVersion($version)
    {
        $this->version = $version;

        return $this;
    }

    /**
     * Get the value of imageFormat
     */
    public function getImageFormat()
    {
        return $this->imageFormat;
    }

    /**
     * Set the value of imageFormat
     *
     * @return  self
     */
    public function setImageFormat($imageFormat)
    {
        $this->imageFormat = $imageFormat;

        return $this;
    }

    /**
     * Get the value of crf
     */
    public function getCrf()
    {
        return $this->crf;
    }

    /**
     * Set the value of crf
     *
     * @return  self
     */
    public function setCrf($crf)
    {
        $this->crf = $crf;

        return $this;
    }

    /**
     * Get the value of envVariables
     */
    public function getEnvVariables()
    {
        return $this->envVariables;
    }

    /**
     * Set the value of envVariables
     *
     * @return  self
     */
    public function setEnvVariables($envVariables)
    {
        $this->envVariables = $envVariables;

        return $this;
    }

    /**
     * Get the value of quality
     */
    public function getQuality()
    {
        return $this->quality;
    }

    /**
     * Set the value of quality
     *
     * @return  self
     */
    public function setQuality($quality)
    {
        $this->quality = $quality;

        return $this;
    }

    /**
     * Get the value of maxRetries
     */
    public function getMaxRetries()
    {
        return $this->maxRetries;
    }

    /**
     * Set the value of maxRetries
     *
     * @return  self
     */
    public function setMaxRetries($maxRetries)
    {
        $this->maxRetries = $maxRetries;

        return $this;
    }

    /**
     * Get the value of privacy
     */
    public function getPrivacy()
    {
        return $this->privacy;
    }

    /**
     * Set the value of privacy
     *
     * @return  self
     */
    public function setPrivacy($privacy)
    {
        $this->privacy = $privacy;

        return $this;
    }

    /**
     * Get the value of logLevel
     */
    public function getLogLevel()
    {
        return $this->logLevel;
    }

    /**
     * Set the value of logLevel
     *
     * @return  self
     */
    public function setLogLevel($logLevel)
    {
        $this->logLevel = $logLevel;

        return $this;
    }
    // Setter methods
    public function setFrameRange($frameRange)
    {
        $this->frameRange = $frameRange;
    }

    public function setOutName($outName)
    {
        $this->outName = $outName;
    }

    public function setTimeoutInMilliseconds($timeoutInMilliseconds)
    {
        $this->timeoutInMilliseconds = $timeoutInMilliseconds;
    }

    public function setChromiumOptions($chromiumOptions)
    {
        $this->chromiumOptions = $chromiumOptions;
    }

    public function setScale($scale)
    {
        $this->scale = $scale;
    }

    public function setEveryNthFrame($everyNthFrame)
    {
        $this->everyNthFrame = $everyNthFrame;
    }

    public function setNumberOfGifLoops($numberOfGifLoops)
    {
        $this->numberOfGifLoops = $numberOfGifLoops;
    }

    public function setConcurrencyPerLambda($concurrencyPerLambda)
    {
        $this->concurrencyPerLambda = $concurrencyPerLambda;
    }

    public function setDownloadBehavior($downloadBehavior)
    {
        $this->downloadBehavior = $downloadBehavior;
    }

    // Getter methods
    public function getFrameRange()
    {
        return $this->frameRange;
    }

    public function getOutName()
    {
        return $this->outName;
    }

    public function getTimeoutInMilliseconds()
    {
        return $this->timeoutInMilliseconds;
    }

    public function getChromiumOptions()
    {
        return $this->chromiumOptions;
    }

    public function getScale()
    {
        return $this->scale;
    }

    public function getEveryNthFrame()
    {
        return $this->everyNthFrame;
    }

    public function getNumberOfGifLoops()
    {
        return $this->numberOfGifLoops;
    }

    public function getConcurrencyPerLambda()
    {
        return $this->concurrencyPerLambda;
    }

    public function getDownloadBehavior()
    {
        return $this->downloadBehavior;
    }

    // Setter methods
    public function setMuted($muted)
    {
        $this->muted = $muted;
    }

    public function setOverwrite($overwrite)
    {
        $this->overwrite = $overwrite;
    }

    public function setAudioBitrate($audioBitrate)
    {
        $this->audioBitrate = $audioBitrate;
    }

    public function setVideoBitrate($videoBitrate)
    {
        $this->videoBitrate = $videoBitrate;
    }

    public function setWebhook($webhook)
    {
        $this->webhook = $webhook;
    }

    public function setForceHeight($forceHeight)
    {
        $this->forceHeight = $forceHeight;
    }

    public function setForceWidth($forceWidth)
    {
        $this->forceWidth = $forceWidth;
    }

    public function setOffthreadVideoCacheSizeInBytes($offthreadVideoCacheSizeInBytes)
    {
        $this->offthreadVideoCacheSizeInBytes = $offthreadVideoCacheSizeInBytes;
    }

    // Getter methods
    public function getMuted()
    {
        return $this->muted;
    }

    public function getOverwrite()
    {
        return $this->overwrite;
    }

    public function getAudioBitrate()
    {
        return $this->audioBitrate;
    }

    public function getVideoBitrate()
    {
        return $this->videoBitrate;
    }

    public function getWebhook()
    {
        return $this->webhook;
    }

    public function getForceHeight()
    {
        return $this->forceHeight;
    }

    public function getForceWidth()
    {
        return $this->forceWidth;
    }
    public function getOffthreadVideoCacheSizeInBytes()
    {
        return $this->offthreadVideoCacheSizeInBytes;
    }

    /**
     * Get the value of serverUrl
     */
    public function getServeUrl()
    {
        return $this->serverUrl;
    }

    /**
     * Set the value of serverUrl
     *
     * @return  self
     */
    public function setServeUrl($serverUrl)
    {
        $this->serverUrl = $serverUrl;

        return $this;
    }

    /**
     * Get the value of rendererFunctionName
     */
    public function getRendererFunctionName()
    {
        return $this->rendererFunctionName;
    }

    /**
     * Set the value of rendererFunctionName
     *
     * @return  self
     */
    public function setRendererFunctionName($rendererFunctionName)
    {
        $this->rendererFunctionName = $rendererFunctionName;

        return $this;
    }

    /**
     * Get the value of framesPerLambda
     */
    public function getFramesPerLambda()
    {
        return $this->framesPerLambda;
    }

    /**
     * Set the value of framesPerLambda
     *
     * @return  self
     */
    public function setFramesPerLambda($framesPerLambda)
    {
        $this->framesPerLambda = $framesPerLambda;

        return $this;
    }

    /**
     * Get the value of region
     */
    public function getRegion()
    {
        return $this->region;
    }

    /**
     * Set the value of region
     *
     * @return  self
     */
    public function setRegion($region)
    {
        $this->region = $region;

        return $this;
    }

    /**
     * Get the value of proResProfile
     */
    public function getProResProfile()
    {
        return $this->proResProfile;
    }

    /**
     * Set the value of proResProfile
     *
     * @return  self
     */
    public function setProResProfile($proResProfile)
    {
        $this->proResProfile = $proResProfile;

        return $this;
    }

    /**
     * Get the value of pixelFormat
     */
    public function getPixelFormat()
    {
        return $this->pixelFormat;
    }

    /**
     * Set the value of pixelFormat
     *
     * @return  self
     */
    public function setPixelFormat($pixelFormat)
    {
        $this->pixelFormat = $pixelFormat;

        return $this;
    }

    public function getX264Preset()
    {
        return $this->x264Preset;
    }

    public function setX264Preset($x264Preset)
    {
         $this->x264Preset = $x264Preset;
         return $this;
    }
}
