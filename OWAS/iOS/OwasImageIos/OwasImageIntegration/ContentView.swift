//
//  ContentView.swift
//  OwasImageIntegration
//
//  Created by Mathieu Monney on 25/07/2022.
//

import SwiftUI
import Photos
import OwasImage

struct ContentView: View {
    @State private var showImagePicker = false
    @State private var inputImage: UIImage?
    @State private var resultText = "------"
    
    var body: some View {
        VStack(spacing: 20.0) {
            capturedPhotoCenter
        
            Button("Select image", action: {
                let photos = PHPhotoLibrary.authorizationStatus()
                if photos != .authorized {
                    PHPhotoLibrary.requestAuthorization({status in
                        if status == .authorized{
                            showImagePicker.toggle()
                        } else {}
                    })
                } else {
                    showImagePicker.toggle()
                }
            })
            
            Text(resultText)
            .frame(height: 35)
            .padding([.horizontal], 16)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.gray))
        }
        .offset(x: 0, y: 0)
        .sheet(isPresented: $showImagePicker) {
            ImagePicker(sourceType: .photoLibrary) { image in
                self.inputImage = image
                let result = ImageClassifier.sharedInstance().analyseImage(image: image)
                if result[NudityClass.sexy] ?? 0.0 > 0.6 {
                    resultText = "Nudity detected"
                } else {
                    resultText = "Safe image"
                }
                showImagePicker.toggle()
            }
        }
    }
    
    var capturedPhotoCenter: some View{
        Group{
            if let image = inputImage {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 275, height: 275)
                    .clipShape(Circle())
            } else {
                Circle()
                    .frame(width: 275, height: 275, alignment: .center)
                    .foregroundColor(.black)
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
