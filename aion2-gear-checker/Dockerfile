FROM python:3.12-alpine
WORKDIR /app
COPY nc-live-server.py /app/nc-live-server.py
ENV PYTHONDONTWRITEBYTECODE=1
ENV AION_API_HOST=0.0.0.0
ENV AION_API_PORT=8765
USER 10001:10001
EXPOSE 8765
CMD ["python3","-u","/app/nc-live-server.py"]
