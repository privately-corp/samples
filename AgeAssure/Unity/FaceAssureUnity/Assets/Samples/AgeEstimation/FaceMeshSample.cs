using System.Linq;
using System;
using System.Collections;
using TensorFlowLite;
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(WebCamInput))]
public sealed class FaceMeshSample : MonoBehaviour
{
    [SerializeField, FilePopup("*.tflite")]
    private string faceModelFile = "coco_ssd_mobilenet_quant.tflite";

    [SerializeField, FilePopup("*.tflite")]
    private string faceMeshModelFile = "coco_ssd_mobilenet_quant.tflite";

    [SerializeField]
    private bool useLandmarkToDetection = true;

    [SerializeField]
    private RawImage cameraView = null;

    [SerializeField]
    private Material faceMaterial = null;

    [SerializeField]
    private Text text;

    [SerializeField]
    private Button yourButton;

    private PrimitiveDraw draw;
    private MeshFilter faceMeshFilter;
    private Vector3[] faceKeypoints;
    private readonly Vector3[] rtCorners = new Vector3[4];
    private AgeEstimator ageEstimator;
    private AgeEstimationState newState = AgeEstimationState.ModelNotReady;
    private TextureResizer resizer = new TextureResizer();
    private TextureResizer.ResizeOptions resizeOptions;
    private int imageSize = 0;
    private bool useLiveness = true;
    private string apiKey = "";
    private string apiSecret = "";
    private string jwtToken = "";

    private IEnumerator Start()
    {
        // Need the WebCam Authorization before using Camera on mobile devices
        if (!Application.HasUserAuthorization(UserAuthorization.WebCam))
        {
            yield return Application.RequestUserAuthorization(UserAuthorization.WebCam);
        }

        ageEstimator = new AgeEstimator();
        ageEstimator.Authenticate(apiKey, apiSecret);
        // startEstimation(jwtToken);
        ageEstimator.SetUseLiveness(useLiveness);

        Button btn = yourButton.GetComponent<Button>();
		Text buttonText = btn.GetComponentInChildren<Text>();
        buttonText.text = "Deactivate liveness";
        buttonText.fontSize = 20;

        var webCamInput = GetComponent<WebCamInput>();
        webCamInput.OnTextureUpdate.AddListener(OnTextureUpdate);
    }

    private async void startEstimation(string jwtToken)
    {
        var response = await ageEstimator.Authenticate(jwtToken);
    }

    private void OnDestroy()
    {
        var webCamInput = GetComponent<WebCamInput>();
        webCamInput.OnTextureUpdate.RemoveListener(OnTextureUpdate);
    }

    private void Update()
    {
        // DrawResults(detectionResult, meshResult);
    }

    public void ToggleLiveness()
    {
        useLiveness = !useLiveness;
        ageEstimator.SetUseLiveness(useLiveness);
    }

    private void OnTextureUpdate(Texture texture)
    {
        if (imageSize <= 0) {
            var imageSize = Math.Min(texture.width, texture.height);
            resizeOptions = new TextureResizer.ResizeOptions()
            {
                aspectMode = AspectMode.Fill,
                rotationDegree = 0,
                mirrorHorizontal = false,
                mirrorVertical = false,
                width = imageSize,
                height = imageSize,
            };
        }
        RenderTexture resized = resizer.Resize(texture, resizeOptions);
        cameraView.material = resizer.material;
        if (newState != AgeEstimationState.EstimationCompleted) {
            runAgeEstimation(texture);
        }
    }

    private void runAgeEstimation(Texture texture)
    {
        AgeEstimationState newState = ageEstimator.OnTextureUpdate(texture);

        string newText = "";
        if (newState == AgeEstimationState.EstimationCompleted) {
            var result = ageEstimator.GetResult();
            text.text = result.minAge.ToString("0.00") + " - " + result.maxAge.ToString("0.00");
        } else {
            text.text = GetTextFromState(newState);
        }
    }
    
    private string GetTextFromState(AgeEstimationState state)
    {
        switch (state)
        {
            case AgeEstimationState.GetReady:
                return "Get ready!";
            case AgeEstimationState.NoFace:
                return "Can't find you";
            case AgeEstimationState.EstimationCompleted:
                return "";
            case AgeEstimationState.StayStill:
                return "Stay still!";
            case AgeEstimationState.LookStraight:
                return "Please look straight to camera";
            case AgeEstimationState.CentreFace:
            case AgeEstimationState.TooUp:
            case AgeEstimationState.TooDown:
            case AgeEstimationState.TooLeft:
            case AgeEstimationState.TooRight:
                return "Center your face with the camera view";
            case AgeEstimationState.TurnLeft:
                return "Turn your head left";
            case AgeEstimationState.TurnRight:
                return "Turn your head right";
            case AgeEstimationState.AlignYourFaceWithTheCameraUp:
                return "Align your face up";
            case AgeEstimationState.AlignYourFaceWithTheCameraDown:
                return "Align your face down";
            case AgeEstimationState.SlightlyTiltYourHeadLeft:
                return "Tilt your head left";
            case AgeEstimationState.SlightlyTiltYourHeadRight:
                return "Tilt your head right";
            case AgeEstimationState.OpenYourMouth:
                return "Open your mouth";
            case AgeEstimationState.KeepYourMouthOpen:
                return "Keep your mouth opened";
            case AgeEstimationState.CloseYourMouth:
                return "Close your mouth";
            case AgeEstimationState.Smile:
                return "Show your big smile with teeth!";
            case AgeEstimationState.KeepSmiling:
                return "Keep smiling";
            case AgeEstimationState.StopSmiling:
                return "You can stop smiling";
            case AgeEstimationState.SlowlyComeCloserToTheCamera:
                return "Come closer to the camera";
            case AgeEstimationState.SlowlyDistanceYourselfFromTheCamera:
                return "Distance yourself from the camera";
            case AgeEstimationState.TooDark:
                return "Face towards the light source";
            case AgeEstimationState.ModelNotReady:
                return "Get Ready!";
            default:
                return "Get ready!";
        }
    }
}
