package ch.privately.marginsdk.marginsdkintegration;

import android.app.Activity;
import android.content.Context;
import android.graphics.PointF;
import android.graphics.Rect;
import android.os.Bundle;
import android.util.Log;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.AspectRatio;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.cardview.widget.CardView;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.LifecycleOwner;

import com.google.common.util.concurrent.ListenableFuture;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import ch.privately.ageestimation.image.AgeEstimationListener;
import ch.privately.ageestimation.image.FaceOrientation;
import ch.privately.ageestimation.image.AgeEstimationResult;
import ch.privately.ageestimation.image.FaceStatus;
import ch.privately.ageestimation.image.ImageAgeDetector;

public class ImageActivity extends AppCompatActivity {
    private static final String TAG = "ImageActivity";
    private boolean useFrontCamera = true;

    private ListenableFuture<ProcessCameraProvider> cameraProviderFuture;
    private PreviewView previewView;
    private ImageCapture imageCapture;
    private Camera camera;
    private List<Boolean> estimations = new ArrayList<>();
    private ExecutorService cameraExecutor;
    private ImageAgeDetector ageDetector;
    private CardView captureButton;
    private CardView estimationResultView;
    private TextView estimationResultText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setContentView(R.layout.activity_image_age_estimation);
        previewView = findViewById(R.id.previewView);
        estimationResultView = findViewById(R.id.image_estimation_result_card);
        estimationResultText = findViewById(R.id.image_estimation_result);
        captureButton = findViewById(R.id.capture_button);

        captureButton.setOnClickListener(view -> {
            onClick();
        });
        cameraProviderFuture = ProcessCameraProvider.getInstance(this);
        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                bindPreview(cameraProvider);
            } catch (ExecutionException | InterruptedException e) {
                // No errors need to be handled for this Future.
                // This should never be reached.
            }
        }, ContextCompat.getMainExecutor(this));

        cameraExecutor = Executors.newSingleThreadExecutor();
        ageDetector = ImageAgeDetector.getAgeDetector(this);
    }

    void bindPreview(@NonNull ProcessCameraProvider cameraProvider) {
        Preview preview = new Preview.Builder()
                .build();

        CameraSelector cameraSelector = new CameraSelector.Builder()
                .requireLensFacing(CameraSelector.LENS_FACING_FRONT)
                .build();

        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        Display display = ((WindowManager) getSystemService(Context.WINDOW_SERVICE)).getDefaultDisplay();
        int rotation = display.getRotation();
        imageCapture =
                new ImageCapture.Builder()
                        .setTargetRotation(rotation)
                        .build();

        camera = cameraProvider.bindToLifecycle(this, cameraSelector, imageCapture, preview);
    }

    public void onClick() {
        runOnUiThread(() -> {
            estimationResultView.setVisibility(View.GONE);
        });

        imageCapture.takePicture(cameraExecutor, new ImageCapture.OnImageCapturedCallback() {
            @Override
            public void onCaptureSuccess(@NonNull ImageProxy image) {
                super.onCaptureSuccess(image);

                AgeEstimationResult estimationResult = ageDetector.getAgeEstimation(image.toBitmap());
                runOnUiThread(() -> {
                    if (estimationResult.isValid()) {
                        estimationResultText.setText((int)estimationResult.getMinAge() + " - " + (int)estimationResult.getMaxAge());
                        estimationResultView.setVisibility(View.VISIBLE);
                    } else {
                        if (estimationResult.getFaceStatus() == FaceStatus.FACE_TOO_FAR) {
                            Toast.makeText(ImageActivity.this, "Please come closer to the screen", Toast.LENGTH_LONG).show();
                        } else {
                            Toast.makeText(ImageActivity.this, "Please make sure your face is centered", Toast.LENGTH_LONG).show();
                        }
                    }
                });

                image.close();
            }

            @Override
            public void onError(@NonNull ImageCaptureException exception) {
                super.onError(exception);
            }
        });
    }
}
